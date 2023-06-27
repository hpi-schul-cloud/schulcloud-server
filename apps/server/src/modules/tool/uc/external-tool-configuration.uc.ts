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
import {
	ContextExternalToolService,
	ContextTypeMapper,
	ExternalToolService,
	SchoolExternalToolService,
} from '../service';
import { AvailableToolsForContext } from './dto/external-tool-configuration.types';

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

		const schoolExternalToolsInUse: SchoolExternalToolDO[] =
			await this.schoolExternalToolService.findSchoolExternalTools({
				schoolId,
			});

		const toolIdsInUse: EntityId[] = schoolExternalToolsInUse.map(
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
	): Promise<AvailableToolsForContext[]> {
		await this.ensureContextPermission(userId, contextId, contextType);

		const [externalTools, schoolExternalTools, contextExternalToolsInUse]: [
			Page<ExternalToolDO>,
			SchoolExternalToolDO[],
			ContextExternalToolDO[]
		] = await Promise.all([
			this.externalToolService.findExternalTools({}),
			this.schoolExternalToolService.findSchoolExternalTools({
				schoolId,
			}),
			this.contextExternalToolService.findContextExternalTools({
				context: { id: contextId, type: contextType },
			}),
		]);

		const availableSchoolExternalTools: SchoolExternalToolDO[] = this.filterForAvailableSchoolExternalTools(
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
		schoolExternalTools: SchoolExternalToolDO[],
		contextExternalToolsInUse: ContextExternalToolDO[]
	): SchoolExternalToolDO[] {
		const availableSchoolExternalTools: SchoolExternalToolDO[] = schoolExternalTools.filter(
			(schoolExternalTool: SchoolExternalToolDO): boolean => {
				const hasContextExternalTool: boolean = contextExternalToolsInUse.some(
					(contextExternalTool: ContextExternalToolDO) =>
						contextExternalTool.schoolToolRef.schoolToolId === schoolExternalTool.id
				);

				return !hasContextExternalTool;
			}
		);

		return availableSchoolExternalTools;
	}

	private filterForAvailableExternalTools(
		externalTools: ExternalToolDO[],
		availableSchoolExternalTools: SchoolExternalToolDO[]
	): AvailableToolsForContext[] {
		const toolsWithSchoolTool: (AvailableToolsForContext | null)[] = availableSchoolExternalTools.map(
			(schoolExternalTool: SchoolExternalToolDO) => {
				const externalTool: ExternalToolDO | undefined = externalTools.find(
					(tool: ExternalToolDO) => schoolExternalTool.toolId === tool.id
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

	public async getExternalToolForContext(
		userId: EntityId,
		externalToolId: EntityId,
		contextId: string,
		contextType: ToolContextType
	): Promise<ExternalToolDO> {
		await this.ensureContextPermission(userId, contextId, contextType);
		const externalToolDO: ExternalToolDO = await this.externalToolService.getExternalToolForScope(
			externalToolId,
			CustomParameterScope.CONTEXT
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
