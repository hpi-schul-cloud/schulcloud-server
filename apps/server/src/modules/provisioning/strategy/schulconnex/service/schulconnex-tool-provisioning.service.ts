import { Logger } from '@core/logger';
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
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { ExternalToolMetadataUpdateFailedLoggable, SchoolExternalToolCreatedLoggable } from '../../../loggable';

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

		const mediaUserLicenses: MediaUserLicense[] = await this.mediaUserLicenseService.getMediaUserLicensesForUser(
			userId
		);

		const mediaSchoolLicenses: MediaSchoolLicense[] =
			await this.mediaSchoolLicenseService.findMediaSchoolLicensesBySchoolId(schoolId);

		const mediaLicenses: MediumIdentifier[] = [...mediaUserLicenses, ...mediaSchoolLicenses];

		await Promise.all(
			mediaLicenses.map(async (license: MediumIdentifier): Promise<void> => {
				let externalTool: ExternalTool | null = await this.externalToolService.findExternalToolByMedium(
					license.mediumId,
					license.mediaSource?.sourceId
				);

				if (!externalTool) {
					externalTool = await this.provisionExternalTool(license);
				}

				if (
					externalTool?.medium?.status !== ExternalToolMediumStatus.ACTIVE ||
					!this.hasOnlyGlobalParamters(externalTool)
				) {
					return;
				}

				const schoolExternalTools: SchoolExternalTool[] = await this.schoolExternalToolService.findSchoolExternalTools({
					schoolId,
					toolId: externalTool.id,
				});

				if (schoolExternalTools.length === 0) {
					const schoolExternalTool: SchoolExternalTool = await this.createSchoolExternalTool(externalTool, schoolId);

					this.logger.notice(new SchoolExternalToolCreatedLoggable(userId, license, schoolExternalTool));
				}
			})
		);
	}

	private async provisionExternalTool(medium: MediumIdentifier): Promise<ExternalTool | null> {
		const template: ExternalTool | null = await this.externalToolService.findTemplate(medium.mediaSource?.sourceId);

		if (!template) {
			return null;
		}

		const externalTool: ExternalTool = new ExternalTool({
			...template.getProps(),
			id: new ObjectId().toHexString(),
			name: `Draft: ${medium.mediaSource?.sourceId ?? '-'} ${medium.mediumId}`,
			thumbnail: undefined, // Thumbnail reference has to be removed to avoid multiple tools pointing to the same file
		});

		if (!externalTool.medium) {
			return null;
		}

		externalTool.medium.status = ExternalToolMediumStatus.DRAFT;
		externalTool.medium.mediumId = medium.mediumId;

		console.log('Bis hierher läufts');
		console.log('external tool: ', externalTool);
		console.log('medium: ', medium);

		await this.updateMetadata(externalTool, medium);

		try {
			await this.externalToolValidationService.validateCreate(externalTool);

			console.log('tool wurde validiert');

			const savedTool: ExternalTool = await this.externalToolService.createExternalTool(externalTool);

			console.log('und gespeichert: ', savedTool);

			return savedTool;
		} catch {
			return null;
		}
	}

	private async updateMetadata(externalTool: ExternalTool, medium: MediumIdentifier): Promise<void> {
		if (!externalTool.medium || !medium.mediaSource?.format) {
			return;
		}

		console.log('Durchs erste If durch');

		try {
			const metadata: MediumMetadataDto = await this.mediumMetadataService.getMetadataItem(
				medium.mediumId,
				medium.mediaSource.sourceId
			);

			console.log('metadaten: ', metadata);

			await this.externalToolMetadataUpdateService.updateExternalToolWithMetadata(
				externalTool,
				metadata,
				medium.mediaSource.format
			);

			console.log('das upgedatete tool: ', externalTool);

			externalTool.medium.status = ExternalToolMediumStatus.ACTIVE;
		} catch (error: unknown) {
			this.logger.warning(new ExternalToolMetadataUpdateFailedLoggable(externalTool, medium, error));
		}
	}

	private hasOnlyGlobalParamters(externalTool: ExternalTool): boolean {
		const hasOnlyGlobalParameters: boolean =
			!externalTool.parameters ||
			externalTool.parameters.every((param: CustomParameter) => param.scope === CustomParameterScope.GLOBAL);

		return hasOnlyGlobalParameters;
	}

	private async createSchoolExternalTool(externalTool: ExternalTool, schoolId: EntityId): Promise<SchoolExternalTool> {
		const schoolExternalTool: SchoolExternalTool = new SchoolExternalTool({
			id: new ObjectId().toHexString(),
			toolId: externalTool.id,
			schoolId,
			isDeactivated: false,
			parameters: [],
		});

		const savedSchoolExternalTool: SchoolExternalTool = await this.schoolExternalToolService.saveSchoolExternalTool(
			schoolExternalTool
		);

		return savedSchoolExternalTool;
	}
}
