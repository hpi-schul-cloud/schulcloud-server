import { Injectable } from '@nestjs/common';
import { ContextExternalToolDO, EntityId, Permission, ToolLaunchDataDO, ToolLaunchRequestDO } from '@shared/domain';
import { Action } from '@src/modules/authorization';
import { ToolLaunchService } from '../service/tool-launch.service';
import { ContextExternalToolService } from '../../service';

@Injectable()
export class ToolLaunchUc {
	constructor(
		private readonly toolLaunchService: ToolLaunchService,
		private readonly contextExternalToolService: ContextExternalToolService
	) {}

	async getToolLaunchRequest(userId: EntityId, contextExternalToolId: EntityId): Promise<ToolLaunchRequestDO> {
		const contextExternalToolDO: ContextExternalToolDO =
			await this.contextExternalToolService.getContextExternalToolById(contextExternalToolId);

		await this.contextExternalToolService.ensureContextPermissions(userId, contextExternalToolDO, {
			requiredPermissions: [Permission.CONTEXT_TOOL_USER],
			action: Action.read,
		});

		const toolLaunchDataDO: ToolLaunchDataDO = await this.toolLaunchService.getLaunchData(contextExternalToolDO);
		const launchRequestDO: ToolLaunchRequestDO = this.toolLaunchService.generateLaunchRequest(toolLaunchDataDO);

		return launchRequestDO;
	}
}
