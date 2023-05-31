import { Injectable } from '@nestjs/common';
import { ContextExternalToolDO, EntityId, Permission } from '@shared/domain';
import { Action } from '@src/modules/authorization';
import { ContextExternalTool } from './dto';
import { ContextExternalToolService, ContextExternalToolValidationService } from '../service';

@Injectable()
export class ContextExternalToolUc {
	constructor(
		private readonly contextExternalToolService: ContextExternalToolService,
		private readonly contextExternalToolValidationService: ContextExternalToolValidationService
	) {}

	async createContextExternalTool(
		userId: EntityId,
		contextExternalTool: ContextExternalTool
	): Promise<ContextExternalToolDO> {
		await this.contextExternalToolService.ensureContextPermissions(userId, contextExternalTool, {
			requiredPermissions: [Permission.CONTEXT_TOOL_ADMIN],
			action: Action.write,
		});

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
		await this.contextExternalToolService.ensureContextPermissions(userId, tool, {
			requiredPermissions: [Permission.CONTEXT_TOOL_ADMIN],
			action: Action.write,
		});

		const promise: Promise<void> = this.contextExternalToolService.deleteContextExternalTool(tool);

		return promise;
	}

	async getContextExternalToolsForContext(userId: EntityId, contextType: ToolContextType, contextId: string) {
		await this.contextExternalToolService.ensureContextPermissions(userId, contextExternalTool, {
			requiredPermissions: [Permission.CONTEXT_TOOL_USER],
			action: Action.read,
		});

		const tools: ContextExternalToolDO[] = await this.contextExternalToolService.getContextExternalToolsForContext(
			contextType,
			contextId
		);

		return tools;
	}
}
