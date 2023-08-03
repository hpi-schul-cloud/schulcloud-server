import { Injectable } from '@nestjs/common';
import { EntityId, Permission } from '@shared/domain';
import { Action } from '@src/modules/authorization';
import { ToolLaunchService } from '../service';
import { ToolLaunchData, ToolLaunchRequest } from '../types';
import { ContextExternalToolService } from '../../context-external-tool/service';
import { ContextExternalTool } from '../../context-external-tool/domain';
import { ToolPermissionsUc } from '../../common/uc/tool-permissions.uc';

@Injectable()
export class ToolLaunchUc {
	constructor(
		private readonly toolLaunchService: ToolLaunchService,
		private readonly contextExternalToolService: ContextExternalToolService,
		private readonly toolPermissionsUc: ToolPermissionsUc
	) {}

	async getToolLaunchRequest(userId: EntityId, contextExternalToolId: EntityId): Promise<ToolLaunchRequest> {
		const contextExternalTool: ContextExternalTool = await this.contextExternalToolService.getContextExternalToolById(
			contextExternalToolId
		);

		await this.toolPermissionsUc.ensureContextPermissions(userId, contextExternalTool, {
			requiredPermissions: [Permission.CONTEXT_TOOL_USER],
			action: Action.read,
		});

		const toolLaunchData: ToolLaunchData = await this.toolLaunchService.getLaunchData(userId, contextExternalTool);
		const launchRequest: ToolLaunchRequest = this.toolLaunchService.generateLaunchRequest(toolLaunchData);

		return launchRequest;
	}
}
