import { Injectable } from '@nestjs/common';
import { Permission } from '@shared/domain/interface/permission.enum';
import { EntityId } from '@shared/domain/types/entity-id';
import { AuthorizationContextBuilder } from '@src/modules/authorization/authorization-context.builder';
import { AuthorizationContext } from '@src/modules/authorization/types/authorization-context.interface';
import { ToolPermissionHelper } from '../../common/uc/tool-permission-helper';
import { ContextExternalTool } from '../../context-external-tool/domain/context-external-tool.do';
import { ContextExternalToolService } from '../../context-external-tool/service/context-external-tool.service';
import { ToolLaunchService } from '../service/tool-launch.service';
import { ToolLaunchData } from '../types/tool-launch-data';
import { ToolLaunchRequest } from '../types/tool-launch-request';

@Injectable()
export class ToolLaunchUc {
	constructor(
		private readonly toolLaunchService: ToolLaunchService,
		private readonly contextExternalToolService: ContextExternalToolService,
		private readonly toolPermissionHelper: ToolPermissionHelper
	) {}

	async getToolLaunchRequest(userId: EntityId, contextExternalToolId: EntityId): Promise<ToolLaunchRequest> {
		const contextExternalTool: ContextExternalTool = await this.contextExternalToolService.findById(
			contextExternalToolId
		);
		const context: AuthorizationContext = AuthorizationContextBuilder.read([Permission.CONTEXT_TOOL_USER]);

		await this.toolPermissionHelper.ensureContextPermissions(userId, contextExternalTool, context);

		const toolLaunchData: ToolLaunchData = await this.toolLaunchService.getLaunchData(userId, contextExternalTool);
		const launchRequest: ToolLaunchRequest = this.toolLaunchService.generateLaunchRequest(toolLaunchData);

		return launchRequest;
	}
}
