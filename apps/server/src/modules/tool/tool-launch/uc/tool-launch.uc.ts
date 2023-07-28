import { Injectable } from '@nestjs/common';
import { EntityId, Permission } from '@shared/domain';
import { Action } from '@src/modules/authorization';
import { ToolLaunchService } from '../service';
import { ToolLaunchData, ToolLaunchRequest } from '../types';
import { ContextExternalToolService } from '../../context-external-tool/service';
import { ContextExternalToolDO } from '../../context-external-tool/domain';

@Injectable()
export class ToolLaunchUc {
	constructor(
		private readonly toolLaunchService: ToolLaunchService,
		private readonly contextExternalToolService: ContextExternalToolService
	) {}

	async getToolLaunchRequest(userId: EntityId, contextExternalToolId: EntityId): Promise<ToolLaunchRequest> {
		const contextExternalToolDO: ContextExternalToolDO =
			await this.contextExternalToolService.getContextExternalToolById(contextExternalToolId);

		await this.contextExternalToolService.ensureContextPermissions(userId, contextExternalToolDO, {
			requiredPermissions: [Permission.CONTEXT_TOOL_USER],
			action: Action.read,
		});

		const toolLaunchData: ToolLaunchData = await this.toolLaunchService.getLaunchData(userId, contextExternalToolDO);
		const launchRequest: ToolLaunchRequest = this.toolLaunchService.generateLaunchRequest(toolLaunchData);

		return launchRequest;
	}
}
