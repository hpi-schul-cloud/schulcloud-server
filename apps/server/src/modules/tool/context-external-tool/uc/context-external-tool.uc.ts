import { Injectable } from '@nestjs/common';
import { User } from '@shared/domain/entity/user.entity';
import { Permission } from '@shared/domain/interface/permission.enum';
import { EntityId } from '@shared/domain/types/entity-id';
import { LegacyLogger } from '@src/core/logger/legacy-logger.service';
import { AuthorizationContextBuilder } from '@src/modules/authorization/authorization-context.builder';
import { AuthorizationService } from '@src/modules/authorization/authorization.service';
import { AuthorizationContext } from '@src/modules/authorization/types/authorization-context.interface';
import { ToolContextType } from '../../common/enum/tool-context-type.enum';
import { ToolPermissionHelper } from '../../common/uc/tool-permission-helper';
import { ContextExternalTool } from '../domain/context-external-tool.do';
import { ContextRef } from '../domain/context-ref';
import { ContextExternalToolValidationService } from '../service/context-external-tool-validation.service';
import { ContextExternalToolService } from '../service/context-external-tool.service';
import { ContextExternalToolDto } from './dto/context-external-tool.types';

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
		const tool: ContextExternalTool = await this.contextExternalToolService.findById(contextExternalToolId);
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
		const tool: ContextExternalTool = await this.contextExternalToolService.findById(contextToolId);
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
