import { Injectable } from '@nestjs/common';
import { ContextExternalToolDO, EntityId, ToolLaunchDataDO, ToolLaunchRequestDO } from '@shared/domain';
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

		await this.contextExternalToolService.ensureContextPermissions(userId, contextExternalToolDO);

		const toolLaunchDataDO: ToolLaunchDataDO = await this.toolLaunchService.getLaunchData(contextExternalToolDO);
		const launchRequestDO: ToolLaunchRequestDO = this.toolLaunchService.generateLaunchRequest(toolLaunchDataDO);

		return launchRequestDO;
	}
}
