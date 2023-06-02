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
	): Promise<[ExternalToolDO[], EntityId[]]> {
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
				contextId,
			}),
		]);

		const schoolExternalToolsInUse: SchoolExternalToolDO[] = this.filterForSchoolExternalToolsInUse(
			schoolExternalTools,
			contextExternalToolsInUse
		);

		const toolIdsInUse: EntityId[] = schoolExternalToolsInUse.map(
			(schoolExternalTool: SchoolExternalToolDO): EntityId => schoolExternalTool.toolId
		);

		const [availableTools, availableSchoolToolIds] = this.filterForAvailableExternalTools(
			externalTools.data,
			schoolExternalTools,
			toolIdsInUse
		);

		return Promise.all([availableTools, availableSchoolToolIds]);
	}

	private filterForSchoolExternalToolsInUse(
		schoolExternalTools: SchoolExternalToolDO[],
		contextExternalToolsInUse: ContextExternalToolDO[]
	): SchoolExternalToolDO[] {
		const schoolExternalToolsInUse: SchoolExternalToolDO[] = schoolExternalTools.filter(
			(schoolExternalTool: SchoolExternalToolDO): boolean => {
				const hasContextExternalTool: boolean = contextExternalToolsInUse.some(
					(contextExternalTool: ContextExternalToolDO) => contextExternalTool.schoolToolId === schoolExternalTool.id
				);

				return hasContextExternalTool;
			}
		);

		return schoolExternalToolsInUse;
	}

	private filterForAvailableExternalTools(
		externalTools: ExternalToolDO[],
		schoolExternalTools: SchoolExternalToolDO[],
		toolIdsInUse: EntityId[]
	): [ExternalToolDO[], EntityId[]] {
		const availableSchoolToolIds: EntityId[] = [];

		const availableTools: ExternalToolDO[] = externalTools.filter((tool: ExternalToolDO): boolean => {
			const hasSchoolExternalTool: boolean = schoolExternalTools.some(
				(schoolExternalTool: SchoolExternalToolDO): boolean => {
					if (schoolExternalTool.toolId === tool.id) {
						availableSchoolToolIds.push(tool.id);

						return true;
					}

					return false;
				}
			);

			return !tool.isHidden && !!tool.id && !toolIdsInUse.includes(tool.id) && hasSchoolExternalTool;
		});

		return [availableTools, availableSchoolToolIds];
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
