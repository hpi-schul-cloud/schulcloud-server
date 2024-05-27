import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { ExternalToolService } from '@modules/tool';
import { MediaUserLicense, UserLicenseService } from '@modules/user-license';
import { SchoolExternalToolService } from '@modules/tool/school-external-tool';
import { ExternalTool } from '@modules/tool/external-tool/domain';
import { SchoolExternalTool } from '@modules/tool/school-external-tool/domain';
import { SchoolSystemOptionsService, SchulConneXProvisioningOptions } from '@modules/legacy-school';
import { SchoolExternalToolConfigurationStatus } from '@modules/tool/school-external-tool/controller/dto';
import { ObjectId } from '@mikro-orm/mongodb';
import { CustomParameter, CustomParameterEntry } from '@modules/tool/common/domain';
import { Logger } from '@src/core/logger';

@Injectable()
export class SchulconnexCtlToolProvisioningService {
	constructor(
		private readonly externalToolService: ExternalToolService,
		private readonly schoolExternalToolService: SchoolExternalToolService,
		private readonly userLicenseService: UserLicenseService,
		private readonly schoolSystemOptionsService: SchoolSystemOptionsService,
		private readonly logger: Logger
	) {}

	async provisionCtlTools(userId: EntityId, schoolId: EntityId, systemId: string): Promise<void> {
		const provisioningOptions: SchulConneXProvisioningOptions = await this.getProvisioningOptionsOrDefault(
			schoolId,
			systemId
		);

		if (!provisioningOptions.ctlToolProvisioningEnabled) {
			return;
		}

		const mediaUserLicenses: MediaUserLicense[] = await this.userLicenseService.getMediaUserLicensesForUser(userId);

		await Promise.all(
			mediaUserLicenses.map(async (license) => {
				const externalTool: ExternalTool | null = await this.externalToolService.findExternalToolByMediumId(
					license.mediumId
				);

				if (!externalTool) {
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

	private async getProvisioningOptionsOrDefault(
		schoolId: EntityId,
		systemId: string
	): Promise<SchulConneXProvisioningOptions> {
		let provisioningOptions: SchulConneXProvisioningOptions;

		if (schoolId) {
			provisioningOptions = await this.schoolSystemOptionsService.getProvisioningOptions(
				SchulConneXProvisioningOptions,
				schoolId,
				systemId
			);
		} else {
			provisioningOptions = new SchulConneXProvisioningOptions();
		}

		return provisioningOptions;
	}

	private async createSchoolExternalTool(externalTool: ExternalTool, schoolId: EntityId) {
		const schoolExternalTool: SchoolExternalTool = this.mapSchoolExternalTool(externalTool, schoolId);

		const createdSchoolExternalTool: SchoolExternalTool = await this.schoolExternalToolService.saveSchoolExternalTool(
			schoolExternalTool
		);

		// 	add loggable?
		// this.logger.info(new NewSchoolExternalToolLoggable(createdSchoolExternalTool));
	}

	mapSchoolExternalTool(externalTool: ExternalTool, schoolId: EntityId): SchoolExternalTool {
		const schoolExternalTool = new SchoolExternalTool({
			id: new ObjectId().toHexString(),
			toolId: externalTool.id,
			schoolId,
			parameters: this.mapToCustomParameter(externalTool.parameters ?? []),
			status: new SchoolExternalToolConfigurationStatus({
				isOutdatedOnScopeSchool: false,
				isDeactivated: externalTool.isDeactivated,
			}),
		});

		return schoolExternalTool;
	}

	private mapToCustomParameter(customParameters: CustomParameter[]): CustomParameterEntry[] {
		return customParameters.map((customParameter: CustomParameter) => {
			return {
				name: customParameter.displayName ?? customParameter.name,
				value: customParameter.default || undefined,
			};
		});
	}
}
