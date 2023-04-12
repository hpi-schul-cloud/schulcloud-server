import { Injectable } from '@nestjs/common';
import { CustomParameterScope, EntityId, Permission } from '@shared/domain';
import { ExternalToolDO } from '@shared/domain/domainobject/external-tool';
import { NotFoundException } from '@nestjs/common/exceptions/not-found.exception';
import { Action, AuthorizationService, AllowedAuthorizationEntityType } from '@src/modules/authorization';
import { Page } from '@shared/domain/domainobject/page';
import { SchoolExternalToolDO } from '@shared/domain/domainobject/external-tool/school-external-tool.do';
import { ExternalToolService, SchoolExternalToolService } from '../service';

@Injectable()
export class ExternalToolConfigurationUc {
	constructor(
		private readonly externalToolService: ExternalToolService,
		private readonly schoolExternalToolService: SchoolExternalToolService,
		private readonly authorizationService: AuthorizationService
	) {}

	async getAvailableToolsForSchool(userId: EntityId, schoolId: EntityId): Promise<ExternalToolDO[]> {
		await this.ensureSchoolPermission(userId, schoolId);

		const externalTools: Page<ExternalToolDO> = await this.externalToolService.findExternalTools({});
		const toolsInUse: SchoolExternalToolDO[] = await this.schoolExternalToolService.findSchoolExternalTools({
			schoolId,
		});
		const toolIdsInUse: EntityId[] = toolsInUse.map(
			(schoolExternalTool: SchoolExternalToolDO): EntityId => schoolExternalTool.toolId
		);

		const availableTools: ExternalToolDO[] = externalTools.data.filter(
			(tool: ExternalToolDO): boolean => !tool.isHidden && !!tool.id && !toolIdsInUse.includes(tool.id)
		);
		return availableTools;
	}

	async getExternalToolForSchool(
		userId: EntityId,
		externalToolId: EntityId,
		schoolId: EntityId
	): Promise<ExternalToolDO> {
		await this.ensureSchoolPermission(userId, schoolId);

		const externalToolDO: ExternalToolDO = await this.externalToolService.getExternalToolForScope(
			externalToolId,
			CustomParameterScope.SCHOOL
		);

		if (externalToolDO.isHidden) {
			throw new NotFoundException('Could not find the Tool Template');
		}

		return externalToolDO;
	}

	private async ensureSchoolPermission(userId: EntityId, schoolId: EntityId) {
		return this.authorizationService.checkIfAuthorizedByReferences(
			userId,
			AllowedAuthorizationEntityType.School,
			schoolId,
			{
				action: Action.read,
				requiredPermissions: [Permission.SCHOOL_TOOL_ADMIN],
			}
		);
	}
}
