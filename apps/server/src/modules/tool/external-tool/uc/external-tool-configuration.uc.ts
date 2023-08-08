import { Inject, Injectable } from '@nestjs/common';
import { NotFoundException } from '@nestjs/common/exceptions/not-found.exception';
import { EntityId, Permission } from '@shared/domain';
import { Page } from '@shared/domain/domainobject/page';
import {
	Action,
	AuthorizableReferenceType,
	AuthorizationContext,
	AuthorizationContextBuilder,
	AuthorizationService,
} from '@src/modules/authorization';
import { CustomParameter } from '../../common/domain';
import { CustomParameterScope, ToolContextType } from '../../common/enum';
import { ContextExternalTool } from '../../context-external-tool/domain';
import { ContextExternalToolService } from '../../context-external-tool/service';
import { SchoolExternalTool } from '../../school-external-tool/domain';
import { SchoolExternalToolService } from '../../school-external-tool/service';
import { IToolFeatures, ToolFeatures } from '../../tool-config';
import { ExternalTool } from '../domain';
import { ExternalToolService } from '../service';
import { ContextExternalToolTemplateInfo } from './dto';
import { ToolPermissionHelper } from '../../context-external-tool/uc/tool-permission-helper';

@Injectable()
export class ExternalToolConfigurationUc {
	constructor(
		private readonly externalToolService: ExternalToolService,
		private readonly schoolExternalToolService: SchoolExternalToolService,
		private readonly contextExternalToolService: ContextExternalToolService,
		private readonly authorizationService: AuthorizationService,
		private readonly toolPermissionHelper: ToolPermissionHelper,
		@Inject(ToolFeatures) private readonly toolFeatures: IToolFeatures
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

		availableTools.forEach((externalTool) => {
			this.filterParametersForScope(externalTool, CustomParameterScope.SCHOOL);
		});

		return availableTools;
	}

	public async getAvailableToolsForContext(
		userId: EntityId,
		schoolId: EntityId,
		contextId: EntityId,
		contextType: ToolContextType
	): Promise<ContextExternalToolTemplateInfo[]> {
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
		const context: AuthorizationContext = AuthorizationContextBuilder.read([Permission.CONTEXT_TOOL_ADMIN]);

		await this.ensureContextPermissions(userId, contextExternalToolsInUse, context);

		const availableSchoolExternalTools: SchoolExternalTool[] = this.filterForAvailableSchoolExternalTools(
			schoolExternalTools,
			contextExternalToolsInUse
		);

		const availableToolsForContext: ContextExternalToolTemplateInfo[] = this.filterForAvailableExternalTools(
			externalTools.data,
			availableSchoolExternalTools
		);

		availableToolsForContext.forEach((toolTemplateInfo) => {
			this.filterParametersForScope(toolTemplateInfo.externalTool, CustomParameterScope.CONTEXT);
		});

		return availableToolsForContext;
	}

	private filterForAvailableSchoolExternalTools(
		schoolExternalTools: SchoolExternalTool[],
		contextExternalToolsInUse: ContextExternalTool[]
	): SchoolExternalTool[] {
		const availableSchoolExternalTools: SchoolExternalTool[] = schoolExternalTools.filter(
			(schoolExternalTool: SchoolExternalTool): boolean => {
				if (this.toolFeatures.contextConfigurationEnabled) {
					return true;
				}

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
	): ContextExternalToolTemplateInfo[] {
		const toolsWithSchoolTool: (ContextExternalToolTemplateInfo | null)[] = availableSchoolExternalTools.map(
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

		const availableTools: ContextExternalToolTemplateInfo[] = toolsWithSchoolTool.filter(
			(toolRef): toolRef is ContextExternalToolTemplateInfo => !!toolRef && !toolRef.externalTool.isHidden
		);

		return availableTools;
	}

	public async getTemplateForSchoolExternalTool(
		userId: EntityId,
		schoolExternalToolId: EntityId
	): Promise<ExternalTool> {
		const schoolExternalTool: SchoolExternalTool = await this.schoolExternalToolService.getSchoolExternalToolById(
			schoolExternalToolId
		);

		await this.ensureSchoolPermission(userId, schoolExternalTool.schoolId);

		const externalTool: ExternalTool = await this.externalToolService.findExternalToolById(schoolExternalTool.toolId);

		if (externalTool.isHidden) {
			throw new NotFoundException('Could not find the Tool Template');
		}

		this.filterParametersForScope(externalTool, CustomParameterScope.SCHOOL);

		return externalTool;
	}

	public async getTemplateForContextExternalTool(
		userId: EntityId,
		contextExternalToolId: EntityId
	): Promise<ContextExternalToolTemplateInfo> {
		const contextExternalTool: ContextExternalTool = await this.contextExternalToolService.getContextExternalToolById(
			contextExternalToolId
		);
		const context: AuthorizationContext = AuthorizationContextBuilder.read([Permission.CONTEXT_TOOL_ADMIN]);

		await this.toolPermissionHelper.ensureContextPermissions(userId, contextExternalTool, context);

		const schoolExternalTool: SchoolExternalTool = await this.schoolExternalToolService.getSchoolExternalToolById(
			contextExternalTool.schoolToolRef.schoolToolId
		);

		const externalTool: ExternalTool = await this.externalToolService.findExternalToolById(schoolExternalTool.toolId);

		if (externalTool.isHidden) {
			throw new NotFoundException('Could not find the Tool Template');
		}

		this.filterParametersForScope(externalTool, CustomParameterScope.CONTEXT);

		return {
			externalTool,
			schoolExternalTool,
		};
	}

	private filterParametersForScope(externalTool: ExternalTool, scope: CustomParameterScope) {
		if (externalTool.parameters) {
			externalTool.parameters = externalTool.parameters.filter(
				(parameter: CustomParameter) => parameter.scope === scope
			);
		}
	}

	private async ensureSchoolPermission(userId: EntityId, schoolId: EntityId) {
		return this.authorizationService.checkPermissionByReferences(userId, AuthorizableReferenceType.School, schoolId, {
			action: Action.read,
			requiredPermissions: [Permission.SCHOOL_TOOL_ADMIN],
		});
	}

	private async ensureContextPermissions(
		userId: EntityId,
		tools: ContextExternalTool[],
		context: AuthorizationContext
	): Promise<void> {
		for (const tool of tools) {
			// eslint-disable-next-line no-await-in-loop
			await this.toolPermissionHelper.ensureContextPermissions(userId, tool, context);
		}
	}
}
