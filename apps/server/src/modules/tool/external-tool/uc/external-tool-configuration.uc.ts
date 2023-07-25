import { Inject, Injectable } from '@nestjs/common';
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
import { ToolContextType } from '../../common/interface';
import { ContextTypeMapper } from '../../common/mapper';
import { ContextExternalToolService } from '../../context-external-tool/service';
import { SchoolExternalToolService } from '../../school-external-tool/service';
import { IToolFeatures, ToolFeatures } from '../../tool-config';
import { ExternalToolService } from '../service';
import { ContextExternalToolTemplateInfo } from './dto';

@Injectable()
export class ExternalToolConfigurationUc {
	constructor(
		private readonly externalToolService: ExternalToolService,
		private readonly schoolExternalToolService: SchoolExternalToolService,
		private readonly contextExternalToolService: ContextExternalToolService,
		private readonly authorizationService: AuthorizationService,
		@Inject(ToolFeatures) private readonly toolFeatures: IToolFeatures
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
	): Promise<ContextExternalToolTemplateInfo[]> {
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

		const availableToolsForContext: ContextExternalToolTemplateInfo[] = this.filterForAvailableExternalTools(
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
				if (this.toolFeatures.contextConfigurationEnabled) {
					return true;
				}

				const hasContextExternalTool: boolean = contextExternalToolsInUse.some(
					(contextExternalTool: ContextExternalToolDO) =>
						contextExternalTool.schoolToolRef.schoolToolId === schoolExternalTool.id
				);

				return !hasContextExternalTool;
			}
		);

		return availableSchoolExternalTools;
	}

	// TODO N21-refactor return null with code coverage
	private filterForAvailableExternalTools(
		externalTools: ExternalToolDO[],
		availableSchoolExternalTools: SchoolExternalToolDO[]
	): ContextExternalToolTemplateInfo[] {
		const toolsWithSchoolTool: (ContextExternalToolTemplateInfo | null)[] = availableSchoolExternalTools.map(
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

		const availableTools: ContextExternalToolTemplateInfo[] = toolsWithSchoolTool.filter(
			(toolRef): toolRef is ContextExternalToolTemplateInfo => !!toolRef && !toolRef.externalTool.isHidden
		);

		return availableTools;
	}

	public async getTemplateForSchoolExternalTool(
		userId: EntityId,
		schoolExternalToolId: EntityId
	): Promise<ExternalToolDO> {
		const schoolExternalTool: SchoolExternalToolDO = await this.schoolExternalToolService.getSchoolExternalToolById(
			schoolExternalToolId
		);

		await this.ensureSchoolPermission(userId, schoolExternalTool.schoolId);

		const externalTool: ExternalToolDO = await this.externalToolService.getExternalToolForScope(
			schoolExternalTool.toolId,
			CustomParameterScope.SCHOOL
		);

		if (externalTool.isHidden) {
			throw new NotFoundException('Could not find the Tool Template');
		}

		return externalTool;
	}

	public async getTemplateForContextExternalTool(
		userId: EntityId,
		contextExternalToolId: EntityId
	): Promise<ContextExternalToolTemplateInfo> {
		const contextExternalTool: ContextExternalToolDO = await this.contextExternalToolService.getContextExternalToolById(
			contextExternalToolId
		);

		await this.ensureContextPermission(userId, contextExternalTool.contextRef.id, contextExternalTool.contextRef.type);

		const schoolExternalTool: SchoolExternalToolDO = await this.schoolExternalToolService.getSchoolExternalToolById(
			contextExternalTool.schoolToolRef.schoolToolId
		);

		const externalTool: ExternalToolDO = await this.externalToolService.getExternalToolForScope(
			schoolExternalTool.toolId,
			CustomParameterScope.CONTEXT
		);

		if (externalTool.isHidden) {
			throw new NotFoundException('Could not find the Tool Template');
		}

		return {
			externalTool,
			schoolExternalTool,
		};
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
