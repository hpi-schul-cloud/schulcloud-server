import { Logger } from '@core/logger';
import { ObjectId } from '@mikro-orm/mongodb';
import { SchoolSystemOptionsService, SchulConneXProvisioningOptions } from '@modules/legacy-school';
import { MediumIdentifier } from '@modules/media-source/domain';
import { MediaSchoolLicense, MediaSchoolLicenseService } from '@modules/school-license';
import { ExternalToolService } from '@modules/tool';
import { CustomParameter } from '@modules/tool/common/domain';
import { CustomParameterScope } from '@modules/tool/common/enum';
import { ExternalTool } from '@modules/tool/external-tool/domain';
import { SchoolExternalToolService } from '@modules/tool/school-external-tool';
import { SchoolExternalTool } from '@modules/tool/school-external-tool/domain';
import { MediaUserLicense, MediaUserLicenseService } from '@modules/user-license';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { SchoolExternalToolCreatedLoggable } from '../../../loggable';

@Injectable()
export class SchulconnexToolProvisioningService {
	constructor(
		private readonly externalToolService: ExternalToolService,
		private readonly schoolExternalToolService: SchoolExternalToolService,
		private readonly mediaUserLicenseService: MediaUserLicenseService,
		private readonly mediaSchoolLicenseService: MediaSchoolLicenseService,
		private readonly schoolSystemOptionsService: SchoolSystemOptionsService,
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
				const externalTool: ExternalTool | null = await this.externalToolService.findExternalToolByMedium(
					license.mediumId,
					license.mediaSource?.sourceId
				);

				if (!externalTool || !this.hasOnlyGlobalParamters(externalTool)) {
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
