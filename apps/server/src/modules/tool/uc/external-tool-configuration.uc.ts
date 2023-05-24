import { Injectable } from '@nestjs/common';
import { NotFoundException } from '@nestjs/common/exceptions/not-found.exception';
import {
	ContextExternalToolDO,
	CustomParameterScope,
	EntityId,
	Permission,
	SchoolExternalToolDO,
} from '@shared/domain';
import { Page } from '@shared/domain/domainobject/page';
import { ExternalToolDO } from '@shared/domain/domainobject/tool';
import { Action, AuthorizableReferenceType, AuthorizationService } from '@src/modules/authorization';
import { ToolContextType } from '../interface';
import { ContextExternalToolService, ExternalToolService, SchoolExternalToolService } from '../service';
import { ContextTypeMapper } from './mapper';

@Injectable()
export class ExternalToolConfigurationUc {
	constructor(
		private readonly externalToolService: ExternalToolService,
		private readonly schoolExternalToolService: SchoolExternalToolService,
		private readonly contextExternalToolService: ContextExternalToolService,
		private readonly authorizationService: AuthorizationService
	) {}

	public async getAvailableToolsForSchool(userId: EntityId, schoolId: EntityId): Promise<ExternalToolDO[]> {
		await this.ensureSchoolPermission(userId, schoolId);

		const externalTools: Page<ExternalToolDO> = await this.externalToolService.findExternalTools({});

		const schoolToolsInUse: SchoolExternalToolDO[] = await this.schoolExternalToolService.findSchoolExternalTools({
			schoolId,
		});

		const toolIdsInUse: EntityId[] = schoolToolsInUse.map(
			(schoolExternalTool: SchoolExternalToolDO): EntityId => schoolExternalTool.toolId
		);

		const availableTools: ExternalToolDO[] = externalTools.data.filter(
			(tool: ExternalToolDO): boolean => !tool.isHidden && !!tool.id && !toolIdsInUse.includes(tool.id)
		);
		return availableTools;
	}

	public async getAvailableToolsForContext(
		userId: EntityId,
		schoolId: EntityId,
		contextId: EntityId,
		contextType: ToolContextType
	): Promise<ExternalToolDO[]> {
		await this.ensureContextPermission(userId, contextId, contextType);

		const externalTools: Page<ExternalToolDO> = await this.externalToolService.findExternalTools({});

		const schoolExternalTools: SchoolExternalToolDO[] = await this.schoolExternalToolService.findSchoolExternalTools({
			schoolId,
		});

		const contextToolsInUse: ContextExternalToolDO[] = await this.contextExternalToolService.findContextExternalTools({
			contextId,
		});

		const schoolToolsInUse: SchoolExternalToolDO[] = schoolExternalTools.filter(
			(schoolExternalTool: SchoolExternalToolDO): boolean =>
				contextToolsInUse.some(
					(contextExternalTool: ContextExternalToolDO) => contextExternalTool.schoolToolId === schoolExternalTool.id
				)
		);

		const toolIdsInUse: EntityId[] = schoolToolsInUse.map(
			(schoolExternalTool: SchoolExternalToolDO): EntityId => schoolExternalTool.toolId
		);

		const availableTools: ExternalToolDO[] = externalTools.data.filter((tool: ExternalToolDO): boolean => {
			const hasSchoolTool: boolean = schoolExternalTools.some(
				(schoolExternalTool: SchoolExternalToolDO): boolean => schoolExternalTool.toolId === tool.id
			);

			return !tool.isHidden && !!tool.id && !toolIdsInUse.includes(tool.id) && hasSchoolTool;
		});

		return availableTools;
	}

	public async getExternalToolForSchool(
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
		return this.authorizationService.checkPermissionByReferences(userId, AuthorizableReferenceType.School, schoolId, {
			action: Action.read,
			requiredPermissions: [Permission.SCHOOL_TOOL_ADMIN],
		});
	}

	private async ensureContextPermission(
		userId: EntityId,
		contextId: EntityId,
		contextType: ToolContextType
	): Promise<void> {
		return this.authorizationService.checkPermissionByReferences(
			userId,
			ContextTypeMapper.mapContextTypeToAllowedAuthorizationEntityType(contextType),
			contextId,
			{
				action: Action.read,
				requiredPermissions: [Permission.CONTEXT_TOOL_ADMIN],
			}
		);
	}
}
