import { Injectable } from '@nestjs/common';
import { Actions, EntityId, Permission, User } from '@shared/domain';
import { ExternalToolDO } from '@shared/domain/domainobject/external-tool';
import { SchoolExternalToolDO } from '@shared/domain/domainobject/external-tool/school-external-tool.do';
import { Page } from '@shared/domain/interface/page';
import { SchoolDO } from '@shared/domain/domainobject/school.do';
import { SchoolService } from '@src/modules/school';
import { AuthorizationService } from '@src/modules/authorization';
import { SchoolExternalToolService } from '../service/school-external-tool.service';
import { ExternalToolService } from '../service/external-tool.service';

@Injectable()
export class ExternalToolConfigurationUc {
	constructor(
		private readonly externalToolService: ExternalToolService,
		private readonly schoolExternalToolService: SchoolExternalToolService,
		private readonly authorizationService: AuthorizationService,
		private readonly schoolService: SchoolService
	) {}

	async getAvailableToolsForSchool(userId: EntityId, schoolId: EntityId): Promise<ExternalToolDO[]> {
		await this.ensureSchoolPermission(userId, schoolId, Permission.SCHOOL_TOOL_ADMIN);

		const externalTools: Page<ExternalToolDO> = await this.externalToolService.findExternalTools({});
		const toolsInUse: SchoolExternalToolDO[] = await this.schoolExternalToolService.findSchoolExternalToolsBySchoolId(
			schoolId
		);
		const toolIdsInUse: EntityId[] = toolsInUse.map(
			(schoolExternalTool: SchoolExternalToolDO): EntityId => schoolExternalTool.toolId
		);

		const availableTools: ExternalToolDO[] = externalTools.data.filter(
			(tool: ExternalToolDO): boolean => !tool.isHidden && !!tool.id && !toolIdsInUse.includes(tool.id)
		);
		return availableTools;
	}

	private async ensureSchoolPermission(userId: EntityId, schoolId: EntityId, permission: Permission) {
		const user: User = await this.authorizationService.getUserWithPermissions(userId);
		const school: SchoolDO = await this.schoolService.getSchoolById(schoolId);

		this.authorizationService.checkPermission(user, school, {
			action: Actions.read,
			requiredPermissions: [permission],
		});
	}
}
