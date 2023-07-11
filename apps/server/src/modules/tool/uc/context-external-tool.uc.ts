import { Injectable } from '@nestjs/common';
import { ContextExternalToolDO, ContextRef, EntityId, Permission } from '@shared/domain';
import { Action } from '@src/modules/authorization';
import { LegacyLogger } from '@src/core/logger';
import { ForbiddenLoggableException } from '@src/modules/authorization/errors/forbidden.loggable-exception';
import { ContextExternalTool } from './dto';
import { ContextExternalToolService, ContextExternalToolValidationService } from '../service';
import { ToolContextType } from '../interface';

@Injectable()
export class ContextExternalToolUc {
	constructor(
		private readonly contextExternalToolService: ContextExternalToolService,
		private readonly contextExternalToolValidationService: ContextExternalToolValidationService,
		private readonly logger: LegacyLogger
	) {}

	async createContextExternalTool(
		userId: EntityId,
		contextExternalTool: ContextExternalTool
	): Promise<ContextExternalToolDO> {
		const contextExternalToolDO = new ContextExternalToolDO(contextExternalTool);

		await this.contextExternalToolService.ensureContextPermissions(userId, contextExternalToolDO, {
			requiredPermissions: [Permission.CONTEXT_TOOL_ADMIN],
			action: Action.write,
		});

		await this.contextExternalToolValidationService.validate(contextExternalTool);

		const createdTool: ContextExternalToolDO = await this.contextExternalToolService.createContextExternalTool(
			contextExternalToolDO
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
		const tools: ContextExternalToolDO[] = await this.contextExternalToolService.findAllByContext(
			new ContextRef({ id: contextId, type: contextType })
		);

		const toolsWithPermission: ContextExternalToolDO[] = await this.filterToolsWithPermissions(userId, tools);

		return toolsWithPermission;
	}

	private async filterToolsWithPermissions(
		userId: EntityId,
		tools: ContextExternalToolDO[]
	): Promise<ContextExternalToolDO[]> {
		const toolPromises = tools.map(async (tool) => {
			try {
				await this.contextExternalToolService.ensureContextPermissions(userId, tool, {
					requiredPermissions: [Permission.CONTEXT_TOOL_ADMIN],
					action: Action.read,
				});

				return tool;
			} catch (error) {
				if (error instanceof ForbiddenLoggableException) {
					this.logger.debug(`User ${userId} does not have permission for tool ${tool.id ?? 'undefined'}`);
					return null;
				}
				throw error;
			}
		});

		const toolsWithPermission = await Promise.all(toolPromises);
		const filteredTools: ContextExternalToolDO[] = toolsWithPermission.filter(
			(tool) => tool !== null
		) as ContextExternalToolDO[];
		return filteredTools;
	}
}
