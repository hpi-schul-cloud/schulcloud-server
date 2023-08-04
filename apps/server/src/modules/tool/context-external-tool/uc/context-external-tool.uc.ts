import { Injectable } from '@nestjs/common';
import { EntityId, Permission } from '@shared/domain';
import { Action } from '@src/modules/authorization';
import { LegacyLogger } from '@src/core/logger';
import { ForbiddenLoggableException } from '@src/modules/authorization/errors/forbidden.loggable-exception';
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
		private readonly logger: LegacyLogger
	) {}

	async createContextExternalTool(
		userId: EntityId,
		contextExternalToolDto: ContextExternalToolDto
	): Promise<ContextExternalTool> {
		const contextExternalTool = new ContextExternalTool(contextExternalToolDto);

		await this.toolPermissionHelper.ensureContextPermissions(userId, contextExternalTool, {
			requiredPermissions: [Permission.CONTEXT_TOOL_ADMIN],
			action: Action.write,
		});

		await this.contextExternalToolValidationService.validate(contextExternalToolDto);

		const createdTool: ContextExternalTool = await this.contextExternalToolService.createContextExternalTool(
			contextExternalTool
		);

		return createdTool;
	}

	async deleteContextExternalTool(userId: EntityId, contextExternalToolId: EntityId): Promise<void> {
		const tool: ContextExternalTool = await this.contextExternalToolService.getContextExternalToolById(
			contextExternalToolId
		);
		await this.toolPermissionHelper.ensureContextPermissions(userId, tool, {
			requiredPermissions: [Permission.CONTEXT_TOOL_ADMIN],
			action: Action.write,
		});

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

	private async filterToolsWithPermissions(
		userId: EntityId,
		tools: ContextExternalTool[]
	): Promise<ContextExternalTool[]> {
		const toolPromises = tools.map(async (tool) => {
			try {
				await this.toolPermissionHelper.ensureContextPermissions(userId, tool, {
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
		const filteredTools: ContextExternalTool[] = toolsWithPermission.filter(
			(tool) => tool !== null
		) as ContextExternalTool[];
		return filteredTools;
	}
}
