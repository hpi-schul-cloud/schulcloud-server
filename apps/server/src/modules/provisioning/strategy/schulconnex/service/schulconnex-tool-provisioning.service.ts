import { Logger } from '@infra/logger';
import { ObjectId } from '@mikro-orm/mongodb';
import { SchoolSystemOptionsService, SchulConneXProvisioningOptions } from '@modules/legacy-school';
import { MediumIdentifier } from '@modules/media-source';
import { ExternalToolMetadataUpdateService } from '@modules/media-source-sync';
import { MediumMetadataDto, MediumMetadataService } from '@modules/medium-metadata';
import { MediaSchoolLicense, MediaSchoolLicenseService } from '@modules/school-license';
import { ExternalToolService, ExternalToolValidationService } from '@modules/tool';
import { CustomParameter } from '@modules/tool/common/domain';
import { CustomParameterScope } from '@modules/tool/common/enum';
import { ExternalTool } from '@modules/tool/external-tool/domain';
import { ExternalToolMediumStatus } from '@modules/tool/external-tool/enum';
import { SchoolExternalToolService } from '@modules/tool/school-external-tool';
import { SchoolExternalTool } from '@modules/tool/school-external-tool/domain';
import { MediaUserLicense, MediaUserLicenseService } from '@modules/user-license';
import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import {
	ExternalToolMetadataUpdateFailedLoggable,
	ExternalToolProvisioningFailedLoggable,
	ExternalToolCreatedLoggable,
	SchoolExternalToolCreatedLoggable,
} from '../../../loggable';

@Injectable()
export class SchulconnexToolProvisioningService {
	constructor(
		private readonly externalToolService: ExternalToolService,
		private readonly schoolExternalToolService: SchoolExternalToolService,
		private readonly mediaUserLicenseService: MediaUserLicenseService,
		private readonly mediaSchoolLicenseService: MediaSchoolLicenseService,
		private readonly schoolSystemOptionsService: SchoolSystemOptionsService,
		private readonly externalToolValidationService: ExternalToolValidationService,
		private readonly mediumMetadataService: MediumMetadataService,
		private readonly externalToolMetadataUpdateService: ExternalToolMetadataUpdateService,
		private readonly logger: Logger
	) {}

	public async provisionSchoolExternalTools(userId: EntityId, schoolId: EntityId, systemId: string): Promise<void> {
		const provisioningOptions: SchulConneXProvisioningOptions =
			await this.schoolSystemOptionsService.getProvisioningOptions(SchulConneXProvisioningOptions, schoolId, systemId);

		if (!provisioningOptions.schoolExternalToolProvisioningEnabled) {
			return;
		}

		const mediaUserLicenses: MediaUserLicense[] =
			await this.mediaUserLicenseService.getMediaUserLicensesForUser(userId);

		const mediaSchoolLicenses: MediaSchoolLicense[] =
			await this.mediaSchoolLicenseService.findMediaSchoolLicensesBySchoolId(schoolId);

		const mediaLicenses: MediumIdentifier[] = [...mediaUserLicenses, ...mediaSchoolLicenses];

		const results = await Promise.allSettled(
			mediaLicenses.map((license: MediumIdentifier): Promise<void> =>
				this.provisionExternalToolForLicense(userId, schoolId, license)
			)
		);

		results.forEach((result: PromiseSettledResult<void>, index: number): void => {
			if (result.status === 'rejected') {
				this.logger.warning(
					new ExternalToolProvisioningFailedLoggable(userId, schoolId, mediaLicenses[index], result.reason)
				);
			}
		});
	}

	private async provisionExternalToolForLicense(
		userId: EntityId,
		schoolId: EntityId,
		license: MediumIdentifier
	): Promise<void> {
		let externalTool: ExternalTool | null = await this.externalToolService.findExternalToolByMedium(
			license.mediumId,
			license.mediaSource?.sourceId
		);

		if (!externalTool) {
			externalTool = await this.provisionExternalTool(license);
			this.logger.notice(new ExternalToolCreatedLoggable(userId, schoolId, license, externalTool));
		}

		if (
			externalTool?.medium?.status !== ExternalToolMediumStatus.ACTIVE ||
			!this.hasOnlyGlobalParamters(externalTool)
		) {
			this.logger.warning(
				new ExternalToolProvisioningFailedLoggable(
					userId,
					schoolId,
					license,
					'External tool is not active or has non-global parameters'
				)
			);
			return;
		}

		await this.provisionSchoolExternalTool(userId, schoolId, license, externalTool);
	}

	private async provisionExternalTool(medium: MediumIdentifier): Promise<ExternalTool> {
		const template = await this.externalToolService.findTemplate(medium.mediaSource?.sourceId);

		if (!template || !template.medium) {
			throw new NotFoundException(`No template found for media source ${medium.mediaSource?.sourceId}`);
		}

		template.medium.status = ExternalToolMediumStatus.DRAFT;
		template.medium.mediumId = medium.mediumId;

		const externalTool = new ExternalTool({
			...template.getProps(),
			id: new ObjectId().toHexString(),
			name: `Draft: ${medium.mediaSource?.sourceId ?? '-'} ${medium.mediumId}`,
			thumbnail: undefined, // Thumbnail reference has to be removed to avoid multiple tools pointing to the same file
		});

		await this.updateMetadata(externalTool, medium);

		await this.externalToolValidationService.validateCreate(externalTool);

		const savedTool = await this.externalToolService.createExternalTool(externalTool);

		return savedTool;
	}

	private async updateMetadata(externalTool: ExternalTool, medium: MediumIdentifier): Promise<void> {
		if (!externalTool.medium || !medium.mediaSource?.format) {
			return;
		}

		try {
			const metadata: MediumMetadataDto = await this.mediumMetadataService.getMetadataItem(
				medium.mediumId,
				medium.mediaSource.sourceId
			);

			await this.externalToolMetadataUpdateService.updateExternalToolWithMetadata(
				externalTool,
				metadata,
				medium.mediaSource.format
			);

			externalTool.medium.status = ExternalToolMediumStatus.ACTIVE;
		} catch (error: unknown) {
			this.logger.warning(new ExternalToolMetadataUpdateFailedLoggable(externalTool, medium, error));
			// do not throw error, as we still want to provision the tool, even if metadata update fails
		}
	}

	private hasOnlyGlobalParamters(externalTool: ExternalTool): boolean {
		const hasOnlyGlobalParameters: boolean =
			!externalTool.parameters ||
			externalTool.parameters.every((param: CustomParameter) => param.scope === CustomParameterScope.GLOBAL);

		return hasOnlyGlobalParameters;
	}

	private async provisionSchoolExternalTool(
		userId: EntityId,
		schoolId: EntityId,
		license: MediumIdentifier,
		externalTool: ExternalTool
	): Promise<void> {
		const schoolExternalTools: SchoolExternalTool[] = await this.schoolExternalToolService.findSchoolExternalTools({
			schoolId,
			toolId: externalTool.id,
		});

		if (schoolExternalTools.length === 0) {
			const schoolExternalTool: SchoolExternalTool = await this.createSchoolExternalTool(externalTool, schoolId);

			this.logger.notice(new SchoolExternalToolCreatedLoggable(userId, license, schoolExternalTool));
		}
	}

	private async createSchoolExternalTool(externalTool: ExternalTool, schoolId: EntityId): Promise<SchoolExternalTool> {
		const schoolExternalTool: SchoolExternalTool = new SchoolExternalTool({
			id: new ObjectId().toHexString(),
			toolId: externalTool.id,
			schoolId,
			isDeactivated: false,
			parameters: [],
		});

		const savedSchoolExternalTool: SchoolExternalTool =
			await this.schoolExternalToolService.saveSchoolExternalTool(schoolExternalTool);

		return savedSchoolExternalTool;
	}
}
