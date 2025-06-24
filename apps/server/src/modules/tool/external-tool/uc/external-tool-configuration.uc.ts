import { AuthorizationContext, AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { BoardContextApiHelperService } from '@modules/board-context';
import { School, SchoolService } from '@modules/school';
import { User } from '@modules/user/repo';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { NotFoundException } from '@nestjs/common/exceptions/not-found.exception';
import { Page } from '@shared/domain/domainobject/page';
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
		private readonly authorizationService: AuthorizationService,
		private readonly schoolService: SchoolService,
		private readonly boardContextApiHelperService: BoardContextApiHelperService
	) {}

	public async getToolContextTypes(userId: EntityId): Promise<ToolContextType[]> {
		const user: User = await this.authorizationService.getUserWithPermissions(userId);
		this.authorizationService.checkAllPermissions(user, [Permission.TOOL_ADMIN]);

		const toolContextTypes: ToolContextType[] = this.externalToolConfigurationService.getToolContextTypes();

		return toolContextTypes;
	}

	public async getAvailableToolsForSchool(userId: EntityId, schoolId: EntityId): Promise<ExternalTool[]> {
		const externalTools: Page<ExternalTool> = await this.externalToolService.findExternalTools({
			isTemplateAllowed: true,
		});

		const schoolExternalToolsInUse: SchoolExternalTool[] = await this.schoolExternalToolService.findSchoolExternalTools(
			{
				schoolId,
			}
		);

		const user: User = await this.authorizationService.getUserWithPermissions(userId);
		const school: School = await this.schoolService.getSchoolById(schoolId);

		const context: AuthorizationContext = AuthorizationContextBuilder.read([Permission.SCHOOL_TOOL_ADMIN]);
		await this.ensureSchoolPermissions(user, schoolExternalToolsInUse, school, context);

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
			externalTool.logoUrl = this.externalToolLogoService.buildLogoUrl(externalTool);
		});

		return availableTools;
	}

	public async getAvailableToolsForContext(
		userId: EntityId,
		contextId: EntityId,
		contextType: ToolContextType
	): Promise<ContextExternalToolTemplateInfo[]> {
		const user: User = await this.authorizationService.getUserWithPermissions(userId);

		let schoolId = user.school.id;
		if (contextType === ToolContextType.BOARD_ELEMENT) {
			schoolId = await this.boardContextApiHelperService.getSchoolIdForBoardNode(contextId);
		}

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
		await this.ensureContextPermissions(user, contextExternalToolsInUse, context);

		const availableToolsForContext: ContextExternalToolTemplateInfo[] = this.prepareAvailableToolsForContext(
			externalTools.data,
			schoolExternalTools,
			contextType
		);

		return availableToolsForContext;
	}

	public async getTemplateForSchoolExternalTool(
		userId: EntityId,
		schoolExternalToolId: EntityId
	): Promise<ExternalTool> {
		const schoolExternalTool: SchoolExternalTool = await this.schoolExternalToolService.findById(schoolExternalToolId);
		const user: User = await this.authorizationService.getUserWithPermissions(userId);
		const school: School = await this.schoolService.getSchoolById(schoolExternalTool.schoolId);

		const context: AuthorizationContext = AuthorizationContextBuilder.read([Permission.SCHOOL_TOOL_ADMIN]);
		this.authorizationService.checkPermission(user, school, context);

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
		const user: User = await this.authorizationService.getUserWithPermissions(userId);

		const context: AuthorizationContext = AuthorizationContextBuilder.read([Permission.CONTEXT_TOOL_ADMIN]);
		await this.toolPermissionHelper.ensureContextPermissions(user, contextExternalTool, context);

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

	public async getPreferedToolsForContext(
		userId: EntityId,
		schoolId: EntityId,
		contextType?: ToolContextType
	): Promise<ContextExternalToolTemplateInfo[]> {
		const user: User = await this.authorizationService.getUserWithPermissions(userId);
		this.authorizationService.checkAllPermissions(user, [Permission.CONTEXT_TOOL_ADMIN]);

		const externalTools: Page<ExternalTool> = await this.externalToolService.findExternalTools({
			isPreferred: true,
		});

		const schoolExternalTools: SchoolExternalTool[] = (
			await Promise.all(
				externalTools.data.map((externalTool) =>
					this.schoolExternalToolService.findSchoolExternalTools({
						toolId: externalTool.id,
						schoolId,
					})
				)
			)
		).flat();

		const preferedTools: ContextExternalToolTemplateInfo[] = this.prepareAvailableToolsForContext(
			externalTools.data,
			schoolExternalTools,
			contextType
		);

		return preferedTools;
	}

	private prepareAvailableToolsForContext(
		externalTools: ExternalTool[],
		schoolExternalTools: SchoolExternalTool[],
		contextType?: ToolContextType
	): ContextExternalToolTemplateInfo[] {
		let availableToolsForContext: ContextExternalToolTemplateInfo[] =
			this.externalToolConfigurationService.filterForAvailableExternalTools(externalTools, schoolExternalTools);

		if (contextType) {
			availableToolsForContext = this.externalToolConfigurationService.filterForContextRestrictions(
				availableToolsForContext,
				contextType
			);
		}

		availableToolsForContext.forEach((toolTemplateInfo) => {
			this.externalToolConfigurationService.filterParametersForScope(
				toolTemplateInfo.externalTool,
				CustomParameterScope.CONTEXT
			);
			toolTemplateInfo.externalTool.logoUrl = this.externalToolLogoService.buildLogoUrl(toolTemplateInfo.externalTool);
		});

		return availableToolsForContext;
	}

	private async ensureSchoolPermissions(
		user: User,
		tools: SchoolExternalTool[],
		school: School,
		context: AuthorizationContext
	): Promise<void> {
		await Promise.all(tools.map(() => this.authorizationService.checkPermission(user, school, context)));
	}

	private async ensureContextPermissions(
		user: User,
		tools: ContextExternalTool[],
		context: AuthorizationContext
	): Promise<void> {
		await Promise.all(
			tools.map(async (tool: ContextExternalTool) =>
				this.toolPermissionHelper.ensureContextPermissions(user, tool, context)
			)
		);
	}
}
