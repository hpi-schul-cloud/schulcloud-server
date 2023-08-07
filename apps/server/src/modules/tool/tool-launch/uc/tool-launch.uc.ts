import { Injectable } from '@nestjs/common';
import { EntityId, Permission } from '@shared/domain';
import { Action, AuthorizationContext, AuthorizationContextBuilder } from '@src/modules/authorization';
import { ToolLaunchService } from '../service';
import { ToolLaunchData, ToolLaunchRequest } from '../types';
import { ContextExternalToolService } from '../../context-external-tool/service';
import { ContextExternalTool } from '../../context-external-tool/domain';
import { ToolPermissionHelper } from '../../common/uc/tool-permission-helper';

@Injectable()
export class ToolLaunchUc {
	constructor(
		private readonly toolLaunchService: ToolLaunchService,
		private readonly contextExternalToolService: ContextExternalToolService,
		private readonly toolPermissionHelper: ToolPermissionHelper
	) {}

	async getToolLaunchRequest(userId: EntityId, contextExternalToolId: EntityId): Promise<ToolLaunchRequest> {
		const contextExternalTool: ContextExternalTool = await this.contextExternalToolService.getContextExternalToolById(
			contextExternalToolId
		);
		const context: AuthorizationContext = AuthorizationContextBuilder.read([Permission.CONTEXT_TOOL_USER]);

		await this.toolPermissionHelper.ensureContextPermissions(userId, contextExternalTool, context);

		const toolLaunchData: ToolLaunchData = await this.toolLaunchService.getLaunchData(userId, contextExternalTool);
		const launchRequest: ToolLaunchRequest = this.toolLaunchService.generateLaunchRequest(toolLaunchData);

		return launchRequest;
	}
}
