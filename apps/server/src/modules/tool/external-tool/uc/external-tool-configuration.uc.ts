import { Injectable } from '@nestjs/common';
import { NotFoundException } from '@nestjs/common/exceptions/not-found.exception';
import { EntityId, Permission } from '@shared/domain';
import { Page } from '@shared/domain/domainobject/page';
import { Action, AuthorizableReferenceType, AuthorizationService } from '@src/modules/authorization';
import { CustomParameterScope, ToolContextType } from '../../common/enum';
import { ExternalToolService } from '../service';
import { SchoolExternalToolService } from '../../school-external-tool/service';
import { ContextExternalToolService } from '../../context-external-tool/service';
import { AvailableToolsForContext } from './dto';
import { ContextTypeMapper } from '../../common/mapper';
import { ExternalTool } from '../domain';
import { SchoolExternalTool } from '../../school-external-tool/domain';
import { ContextExternalTool } from '../../context-external-tool/domain';

@Injectable()
export class ExternalToolConfigurationUc {
	constructor(
		private readonly externalToolService: ExternalToolService,
		private readonly schoolExternalToolService: SchoolExternalToolService,
		private readonly contextExternalToolService: ContextExternalToolService,
		private readonly authorizationService: AuthorizationService
	) {}

	public async getAvailableToolsForSchool(userId: EntityId, schoolId: EntityId): Promise<ExternalTool[]> {
		await this.ensureSchoolPermission(userId, schoolId);

		const externalTools: Page<ExternalTool> = await this.externalToolService.findExternalTools({});

		const schoolExternalToolsInUse: SchoolExternalTool[] = await this.schoolExternalToolService.findSchoolExternalTools(
			{
				schoolId,
			}
		);

		const toolIdsInUse: EntityId[] = schoolExternalToolsInUse.map(
			(schoolExternalTool: SchoolExternalTool): EntityId => schoolExternalTool.toolId
		);

		const availableTools: ExternalTool[] = externalTools.data.filter(
			(tool: ExternalTool): boolean => !tool.isHidden && !!tool.id && !toolIdsInUse.includes(tool.id)
		);
		return availableTools;
	}

	public async getAvailableToolsForContext(
		userId: EntityId,
		schoolId: EntityId,
		contextId: EntityId,
		contextType: ToolContextType
	): Promise<AvailableToolsForContext[]> {
		await this.ensureContextPermission(userId, contextId, contextType);

		const [externalTools, schoolExternalTools, contextExternalToolsInUse]: [
			Page<ExternalTool>,
			SchoolExternalTool[],
			ContextExternalTool[]
		] = await Promise.all([
			this.externalToolService.findExternalTools({}),
			this.schoolExternalToolService.findSchoolExternalTools({
				schoolId,
			}),
			this.contextExternalToolService.findContextExternalTools({
				context: { id: contextId, type: contextType },
			}),
		]);

		const availableSchoolExternalTools: SchoolExternalTool[] = this.filterForAvailableSchoolExternalTools(
			schoolExternalTools,
			contextExternalToolsInUse
		);

		const availableToolsForContext: AvailableToolsForContext[] = this.filterForAvailableExternalTools(
			externalTools.data,
			availableSchoolExternalTools
		);

		return availableToolsForContext;
	}

	private filterForAvailableSchoolExternalTools(
		schoolExternalTools: SchoolExternalTool[],
		contextExternalToolsInUse: ContextExternalTool[]
	): SchoolExternalTool[] {
		const availableSchoolExternalTools: SchoolExternalTool[] = schoolExternalTools.filter(
			(schoolExternalTool: SchoolExternalTool): boolean => {
				const hasContextExternalTool: boolean = contextExternalToolsInUse.some(
					(contextExternalTool: ContextExternalTool) =>
						contextExternalTool.schoolToolRef.schoolToolId === schoolExternalTool.id
				);

				return !hasContextExternalTool;
			}
		);

		return availableSchoolExternalTools;
	}

	// TODO N21-refactor return null with code coverage
	private filterForAvailableExternalTools(
		externalTools: ExternalTool[],
		availableSchoolExternalTools: SchoolExternalTool[]
	): AvailableToolsForContext[] {
		const toolsWithSchoolTool: (AvailableToolsForContext | null)[] = availableSchoolExternalTools.map(
			(schoolExternalTool: SchoolExternalTool) => {
				const externalTool: ExternalTool | undefined = externalTools.find(
					(tool: ExternalTool) => schoolExternalTool.toolId === tool.id
				);

				if (!externalTool) {
					return null;
				}

				return {
					externalTool,
					schoolExternalTool,
				};
			}
		);

		const availableTools: AvailableToolsForContext[] = toolsWithSchoolTool.filter(
			(toolRef): toolRef is AvailableToolsForContext => !!toolRef && !toolRef.externalTool.isHidden
		);

		return availableTools;
	}

	public async getExternalToolForSchool(
		userId: EntityId,
		externalToolId: EntityId,
		schoolId: EntityId
	): Promise<ExternalTool> {
		await this.ensureSchoolPermission(userId, schoolId);
		const externalTool: ExternalTool = await this.externalToolService.getExternalToolForScope(
			externalToolId,
			CustomParameterScope.SCHOOL
		);

		if (externalTool.isHidden) {
			throw new NotFoundException('Could not find the Tool Template');
		}

		return externalTool;
	}

	public async getExternalToolForContext(
		userId: EntityId,
		externalToolId: EntityId,
		contextId: string,
		contextType: ToolContextType
	): Promise<ExternalTool> {
		await this.ensureContextPermission(userId, contextId, contextType);
		const externalTool: ExternalTool = await this.externalToolService.getExternalToolForScope(
			externalToolId,
			CustomParameterScope.CONTEXT
		);

		if (externalTool.isHidden) {
			throw new NotFoundException('Could not find the Tool Template');
		}

		return externalTool;
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
