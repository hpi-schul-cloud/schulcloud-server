import { Inject, Injectable } from '@nestjs/common';
import { NotFoundException } from '@nestjs/common/exceptions/not-found.exception';
import { EntityId, Permission } from '@shared/domain';
import { Page } from '@shared/domain/domainobject/page';
import { AuthorizationContext, AuthorizationContextBuilder } from '@src/modules/authorization';
import { CustomParameterScope, ToolContextType } from '../../common/enum';
import { ContextExternalTool } from '../../context-external-tool/domain';
import { ContextExternalToolService } from '../../context-external-tool/service';
import { SchoolExternalTool } from '../../school-external-tool/domain';
import { SchoolExternalToolService } from '../../school-external-tool/service';
import { ExternalTool } from '../domain';
import { ExternalToolService } from '../service';
import { ContextExternalToolTemplateInfo } from './dto';
import { ToolPermissionHelper } from '../../common/uc/tool-permission-helper';
import { ExternalToolConfigurationService } from '../service/external-tool-configuration.service';

@Injectable()
export class ExternalToolConfigurationUc {
	constructor(
		private readonly externalToolService: ExternalToolService,
		private readonly schoolExternalToolService: SchoolExternalToolService,
		private readonly contextExternalToolService: ContextExternalToolService,
		private readonly toolPermissionHelper: ToolPermissionHelper,
		private readonly externalToolConfigurationService: ExternalToolConfigurationService
	) {}

	public async getAvailableToolsForSchool(userId: EntityId, schoolId: EntityId): Promise<ExternalTool[]> {
		const externalTools: Page<ExternalTool> = await this.externalToolService.findExternalTools({});

		const schoolExternalToolsInUse: SchoolExternalTool[] = await this.schoolExternalToolService.findSchoolExternalTools(
			{
				schoolId,
			}
		);

		const context: AuthorizationContext = AuthorizationContextBuilder.read([Permission.SCHOOL_TOOL_ADMIN]);

		await this.ensureSchoolPermissions(userId, schoolExternalToolsInUse, context);

		const toolIdsInUse: EntityId[] = schoolExternalToolsInUse.map(
			(schoolExternalTool: SchoolExternalTool): EntityId => schoolExternalTool.toolId
		);

		const availableTools: ExternalTool[] = this.externalToolConfigurationService.filterForAvailableTools(
			externalTools,
			toolIdsInUse
		);

		availableTools.forEach((externalTool) => {
			this.externalToolConfigurationService.filterParametersForScope(externalTool, CustomParameterScope.SCHOOL);
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

		const availableSchoolExternalTools: SchoolExternalTool[] =
			this.externalToolConfigurationService.filterForAvailableSchoolExternalTools(
				schoolExternalTools,
				contextExternalToolsInUse
			);

		const availableToolsForContext: ContextExternalToolTemplateInfo[] =
			this.externalToolConfigurationService.filterForAvailableExternalTools(
				externalTools.data,
				availableSchoolExternalTools
			);

		availableToolsForContext.forEach((toolTemplateInfo) => {
			this.externalToolConfigurationService.filterParametersForScope(
				toolTemplateInfo.externalTool,
				CustomParameterScope.CONTEXT
			);
		});

		return availableToolsForContext;
	}

	public async getTemplateForSchoolExternalTool(
		userId: EntityId,
		schoolExternalToolId: EntityId
	): Promise<ExternalTool> {
		const schoolExternalTool: SchoolExternalTool = await this.schoolExternalToolService.getSchoolExternalToolById(
			schoolExternalToolId
		);
		const context: AuthorizationContext = AuthorizationContextBuilder.read([Permission.SCHOOL_TOOL_ADMIN]);

		await this.toolPermissionHelper.ensureSchoolPermissions(userId, schoolExternalTool, context);

		const externalTool: ExternalTool = await this.externalToolService.findExternalToolById(schoolExternalTool.toolId);

		if (externalTool.isHidden) {
			throw new NotFoundException('Could not find the Tool Template');
		}

		this.externalToolConfigurationService.filterParametersForScope(externalTool, CustomParameterScope.SCHOOL);

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

		this.externalToolConfigurationService.filterParametersForScope(externalTool, CustomParameterScope.CONTEXT);

		return {
			externalTool,
			schoolExternalTool,
		};
	}

	private async ensureSchoolPermissions(
		userId: EntityId,
		tools: SchoolExternalTool[],
		context: AuthorizationContext
	): Promise<void> {
		for (const tool of tools) {
			// eslint-disable-next-line no-await-in-loop
			await this.toolPermissionHelper.ensureSchoolPermissions(userId, tool, context);
		}
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
