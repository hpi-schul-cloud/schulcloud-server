import { AuthorizationContext, AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { NotFoundException } from '@nestjs/common/exceptions/not-found.exception';
import { LegacySchoolDo } from '@shared/domain/domainobject';
import { Page } from '@shared/domain/domainobject/page';
import { User } from '@shared/domain/entity';
import { Permission } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { CustomParameterScope, ToolContextType } from '../../common/enum';
import { ToolPermissionHelper } from '../../common/uc/tool-permission-helper';
import { ContextExternalTool } from '../../context-external-tool/domain';
import { ContextExternalToolService } from '../../context-external-tool/service';
import { SchoolExternalTool } from '../../school-external-tool/domain';
import { SchoolExternalToolService } from '../../school-external-tool/service';
import { ExternalTool } from '../domain';
import { ExternalToolConfigurationService, ExternalToolLogoService, ExternalToolService } from '../service';
import { ContextExternalToolTemplateInfo } from './dto';

@Injectable()
export class ExternalToolConfigurationUc {
	constructor(
		private readonly externalToolService: ExternalToolService,
		private readonly schoolExternalToolService: SchoolExternalToolService,
		private readonly contextExternalToolService: ContextExternalToolService,
		@Inject(forwardRef(() => ToolPermissionHelper))
		private readonly toolPermissionHelper: ToolPermissionHelper,
		private readonly externalToolConfigurationService: ExternalToolConfigurationService,
		private readonly externalToolLogoService: ExternalToolLogoService,
		private readonly authorizationService: AuthorizationService
	) {}

	public async getToolContextTypes(userId: EntityId): Promise<ToolContextType[]> {
		const user: User = await this.authorizationService.getUserWithPermissions(userId);
		this.authorizationService.checkAllPermissions(user, [Permission.TOOL_ADMIN]);

		const toolContextTypes: ToolContextType[] = this.externalToolConfigurationService.getToolContextTypes();

		return toolContextTypes;
	}

	public async getAvailableToolsForSchool(userId: EntityId, schoolId: EntityId): Promise<ExternalTool[]> {
		const externalTools: Page<ExternalTool> = await this.externalToolService.findExternalTools({});

		const schoolExternalToolsInUse: SchoolExternalTool[] = await this.schoolExternalToolService.findSchoolExternalTools(
			{
				schoolId,
			}
		);

		const context: AuthorizationContext = AuthorizationContextBuilder.read([Permission.SCHOOL_TOOL_ADMIN]);

		const [user, school] = await this.toolPermissionHelper.getIrgendwas(userId, schoolId);
		await this.ensureSchoolPermissions(user as User, schoolExternalToolsInUse, school as LegacySchoolDo, context);

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

		availableTools.forEach((externalTool) => {
			externalTool.logoUrl = this.externalToolLogoService.buildLogoUrl(
				'/v3/tools/external-tools/{id}/logo',
				externalTool
			);
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

		let availableToolsForContext: ContextExternalToolTemplateInfo[] =
			this.externalToolConfigurationService.filterForAvailableExternalTools(
				externalTools.data,
				availableSchoolExternalTools
			);

		availableToolsForContext = this.externalToolConfigurationService.filterForContextRestrictions(
			availableToolsForContext,
			contextType
		);

		availableToolsForContext.forEach((toolTemplateInfo) => {
			this.externalToolConfigurationService.filterParametersForScope(
				toolTemplateInfo.externalTool,
				CustomParameterScope.CONTEXT
			);
		});

		availableToolsForContext.forEach((toolTemplateInfo) => {
			toolTemplateInfo.externalTool.logoUrl = this.externalToolLogoService.buildLogoUrl(
				'/v3/tools/external-tools/{id}/logo',
				toolTemplateInfo.externalTool
			);
		});

		return availableToolsForContext;
	}

	public async getTemplateForSchoolExternalTool(
		userId: EntityId,
		schoolExternalToolId: EntityId
	): Promise<ExternalTool> {
		const schoolExternalTool: SchoolExternalTool = await this.schoolExternalToolService.findById(schoolExternalToolId);
		const context: AuthorizationContext = AuthorizationContextBuilder.read([Permission.SCHOOL_TOOL_ADMIN]);

		const [user, school] = await this.toolPermissionHelper.getIrgendwas(userId, schoolExternalTool.schoolId);
		this.toolPermissionHelper.ensureSchoolPermissions(user as User, school as LegacySchoolDo, context);

		const externalTool: ExternalTool = await this.externalToolService.findById(schoolExternalTool.toolId);

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
		const contextExternalTool: ContextExternalTool = await this.contextExternalToolService.findByIdOrFail(
			contextExternalToolId
		);

		const context: AuthorizationContext = AuthorizationContextBuilder.read([Permission.CONTEXT_TOOL_ADMIN]);
		await this.toolPermissionHelper.ensureContextPermissions(userId, contextExternalTool, context);

		const schoolExternalTool: SchoolExternalTool = await this.schoolExternalToolService.findById(
			contextExternalTool.schoolToolRef.schoolToolId
		);

		const externalTool: ExternalTool = await this.externalToolService.findById(schoolExternalTool.toolId);

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
		user: User,
		tools: SchoolExternalTool[],
		school: LegacySchoolDo,
		context: AuthorizationContext
	): Promise<void> {
		await Promise.all(tools.map(() => this.toolPermissionHelper.ensureSchoolPermissions(user, school, context)));
	}

	private async ensureContextPermissions(
		userId: EntityId,
		tools: ContextExternalTool[],
		context: AuthorizationContext
	): Promise<void> {
		await Promise.all(
			tools.map(async (tool: ContextExternalTool) =>
				this.toolPermissionHelper.ensureContextPermissions(userId, tool, context)
			)
		);
	}
}
