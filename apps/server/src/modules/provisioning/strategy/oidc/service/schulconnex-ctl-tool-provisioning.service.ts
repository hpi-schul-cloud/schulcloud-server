import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { ExternalToolService } from '@modules/tool';
import { MediaUserLicense, UserLicenseService } from '@modules/user-license';
import { SchoolExternalToolService } from '@modules/tool/school-external-tool';
import { ExternalTool } from '@modules/tool/external-tool/domain';
import { SchoolExternalTool } from '@modules/tool/school-external-tool/domain';

@Injectable()
export class SchulconnexCtlToolProvisioningService {
	constructor(
		private readonly externalToolService: ExternalToolService,
		private readonly schoolExternalToolService: SchoolExternalToolService,
		private readonly userLicenseService: UserLicenseService
	) {}

	async provisionCtlTools(userId: EntityId, schoolId: EntityId): Promise<void> {
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
					// 	create SchoolExternalTool
				};
			})
		);
	}
}
