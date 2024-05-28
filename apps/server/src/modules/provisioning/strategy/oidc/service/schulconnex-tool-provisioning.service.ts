import { ObjectId } from '@mikro-orm/mongodb';
import { SchoolSystemOptionsService, SchulConneXProvisioningOptions } from '@modules/legacy-school';
import { ExternalToolService } from '@modules/tool';
import { CustomParameter } from '@modules/tool/common/domain';
import { CustomParameterScope } from '@modules/tool/common/enum';
import { ExternalTool } from '@modules/tool/external-tool/domain';
import { SchoolExternalToolService } from '@modules/tool/school-external-tool';
import { SchoolExternalTool } from '@modules/tool/school-external-tool/domain';
import { MediaUserLicense, UserLicenseService } from '@modules/user-license';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';

@Injectable()
export class SchulconnexToolProvisioningService {
	constructor(
		private readonly externalToolService: ExternalToolService,
		private readonly schoolExternalToolService: SchoolExternalToolService,
		private readonly userLicenseService: UserLicenseService,
		private readonly schoolSystemOptionsService: SchoolSystemOptionsService
	) {}

	public async provisionSchoolExternalTools(userId: EntityId, schoolId: EntityId, systemId: string): Promise<void> {
		const provisioningOptions: SchulConneXProvisioningOptions =
			await this.schoolSystemOptionsService.getProvisioningOptions(SchulConneXProvisioningOptions, schoolId, systemId);

		if (!provisioningOptions.schoolExternalToolProvisioningEnabled) {
			return;
		}

		const mediaUserLicenses: MediaUserLicense[] = await this.userLicenseService.getMediaUserLicensesForUser(userId);

		await Promise.all(
			mediaUserLicenses.map(async (license) => {
				const externalTool: ExternalTool | null = await this.externalToolService.findExternalToolByMedium(
					license.mediumId,
					license.mediaSourceId
				);

				if (!externalTool || !this.hasOnlyGlobalParamters(externalTool)) {
					return;
				}

				const schoolExternalTools: SchoolExternalTool[] = await this.schoolExternalToolService.findSchoolExternalTools({
					schoolId,
					toolId: externalTool.id,
				});

				if (schoolExternalTools.length === 0) {
					await this.createSchoolExternalTool(externalTool, schoolId);
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

	private async createSchoolExternalTool(externalTool: ExternalTool, schoolId: EntityId) {
		const schoolExternalTool = new SchoolExternalTool({
			id: new ObjectId().toHexString(),
			toolId: externalTool.id,
			schoolId,
			parameters: [],
		});

		await this.schoolExternalToolService.saveSchoolExternalTool(schoolExternalTool);
	}
}
