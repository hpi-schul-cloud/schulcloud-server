import { Injectable } from '@nestjs/common';
import { ContextExternalToolDO, EntityId, Permission } from '@shared/domain';
import { Action, AuthorizationService } from '@src/modules/authorization';
import { ToolContextType } from '@src/modules/tool/interface';
import { ContextTypeMapper } from './mapper';
import { ContextExternalTool } from './dto';
import { ContextExternalToolService, ContextExternalToolValidationService } from '../service';

@Injectable()
export class ContextExternalToolUc {
	constructor(
		private readonly contextExternalToolService: ContextExternalToolService,
		private readonly authorizationService: AuthorizationService,
		private readonly contextExternalToolValidationService: ContextExternalToolValidationService
	) {}

	async createContextExternalTool(
		userId: EntityId,
		contextExternalTool: ContextExternalTool
	): Promise<ContextExternalToolDO> {
		await this.ensureContextPermission(userId, contextExternalTool.contextId, contextExternalTool.contextType);

		await this.contextExternalToolValidationService.validate(contextExternalTool);

		const createdTool: ContextExternalToolDO = await this.contextExternalToolService.createContextExternalTool(
			contextExternalTool
		);

		return createdTool;
	}

	async deleteContextExternalTool(userId: EntityId, contextExternalToolId: EntityId): Promise<void> {
		const tool: ContextExternalToolDO = await this.contextExternalToolService.getContextExternalToolById(
			contextExternalToolId
		);
		await this.ensureContextPermission(userId, tool.contextId, tool.contextType);

		const promise: Promise<void> = this.contextExternalToolService.deleteContextExternalTool(tool);

		return promise;
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
				action: Action.write,
				requiredPermissions: [Permission.CONTEXT_TOOL_ADMIN],
			}
		);
	}

	async getContextExternalToolsForContext(userId: EntityId, contextType: ToolContextType, contextId: string) {
		// TODO: N21-534 use Permission check of N21-877 to be sure that the user has READ permission to course AND tool
		await this.ensureContextPermission(userId, contextId, contextType);

		const tools: ContextExternalToolDO[] = await this.contextExternalToolService.getContextExternalToolsForContext(
			contextType,
			contextId
		);

		return tools;
	}
}
