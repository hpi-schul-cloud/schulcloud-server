import { Injectable } from '@nestjs/common';
import { ContextExternalToolDO, EntityId, Permission } from '@shared/domain';
import { ContextExternalTool } from './dto';
import { ContextExternalToolService, ContextExternalToolValidationService } from '../service';
import { Action } from '../../authorization';

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
}
