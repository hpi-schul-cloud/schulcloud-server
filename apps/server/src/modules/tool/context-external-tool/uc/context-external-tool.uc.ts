import { Injectable } from '@nestjs/common';
import { EntityId, Permission, User } from '@shared/domain';
import { AuthorizationContext, AuthorizationContextBuilder, AuthorizationService } from '@src/modules/authorization';
import { LegacyLogger } from '@src/core/logger';
import { ContextExternalToolService, ContextExternalToolValidationService } from '../service';
import { ContextExternalToolDto } from './dto/context-external-tool.types';
import { ContextExternalTool, ContextRef } from '../domain';
import { ToolContextType } from '../../common/enum';
import { ToolPermissionHelper } from '../../common/uc/tool-permission-helper';

@Injectable()
export class ContextExternalToolUc {
	constructor(
		private readonly toolPermissionHelper: ToolPermissionHelper,
		private readonly contextExternalToolService: ContextExternalToolService,
		private readonly contextExternalToolValidationService: ContextExternalToolValidationService,
		private readonly authorizationService: AuthorizationService,
		private readonly logger: LegacyLogger
	) {}

	async createContextExternalTool(
		userId: EntityId,
		contextExternalToolDto: ContextExternalToolDto
	): Promise<ContextExternalTool> {
		const contextExternalTool = new ContextExternalTool(contextExternalToolDto);
		const context: AuthorizationContext = AuthorizationContextBuilder.write([Permission.CONTEXT_TOOL_ADMIN]);

		await this.toolPermissionHelper.ensureContextPermissions(userId, contextExternalTool, context);

		await this.contextExternalToolValidationService.validate(contextExternalToolDto);

		const createdTool: ContextExternalTool = await this.contextExternalToolService.saveContextExternalTool(
			contextExternalTool
		);

		return createdTool;
	}

	async updateContextExternalTool(
		userId: EntityId,
		contextExternalToolId: EntityId,
		contextExternalToolDto: ContextExternalToolDto
	): Promise<ContextExternalTool> {
		const contextExternalTool: ContextExternalTool = new ContextExternalTool(contextExternalToolDto);

		await this.toolPermissionHelper.ensureContextPermissions(
			userId,
			contextExternalTool,
			AuthorizationContextBuilder.write([Permission.CONTEXT_TOOL_ADMIN])
		);

		const updated: ContextExternalTool = new ContextExternalTool({
			...contextExternalTool,
			id: contextExternalToolId,
		});

		await this.contextExternalToolValidationService.validate(updated);

		const saved: ContextExternalTool = await this.contextExternalToolService.saveContextExternalTool(updated);

		return saved;
	}

	async deleteContextExternalTool(userId: EntityId, contextExternalToolId: EntityId): Promise<void> {
		const tool: ContextExternalTool = await this.contextExternalToolService.getContextExternalToolById(
			contextExternalToolId
		);
		const context: AuthorizationContext = AuthorizationContextBuilder.write([Permission.CONTEXT_TOOL_ADMIN]);

		await this.toolPermissionHelper.ensureContextPermissions(userId, tool, context);

		const promise: Promise<void> = this.contextExternalToolService.deleteContextExternalTool(tool);

		return promise;
	}

	async getContextExternalToolsForContext(userId: EntityId, contextType: ToolContextType, contextId: string) {
		const tools: ContextExternalTool[] = await this.contextExternalToolService.findAllByContext(
			new ContextRef({ id: contextId, type: contextType })
		);

		const toolsWithPermission: ContextExternalTool[] = await this.filterToolsWithPermissions(userId, tools);

		return toolsWithPermission;
	}

	async getContextExternalTool(userId: EntityId, contextToolId: EntityId) {
		const tool: ContextExternalTool = await this.contextExternalToolService.getContextExternalToolById(contextToolId);
		const context: AuthorizationContext = AuthorizationContextBuilder.read([Permission.CONTEXT_TOOL_ADMIN]);

		await this.toolPermissionHelper.ensureContextPermissions(userId, tool, context);

		return tool;
	}

	private async filterToolsWithPermissions(
		userId: EntityId,
		tools: ContextExternalTool[]
	): Promise<ContextExternalTool[]> {
		const user: User = await this.authorizationService.getUserWithPermissions(userId);
		const context: AuthorizationContext = AuthorizationContextBuilder.read([Permission.CONTEXT_TOOL_ADMIN]);

		const toolsWithPermission: ContextExternalTool[] = tools.filter((tool) =>
			this.authorizationService.hasPermission(user, tool, context)
		);

		return toolsWithPermission;
	}
}
