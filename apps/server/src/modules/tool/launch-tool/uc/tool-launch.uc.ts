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

	// TODO: make this work and test it
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async getToolLaunchRequest(userId: EntityId, contextExternalToolId: EntityId): Promise<ToolLaunchRequestDO> {
		// check permission to launch. also use context type and id
		const contextExternalToolDO: ContextExternalToolDO = {} as ContextExternalToolDO;
		const toolLaunchDataDO: ToolLaunchDataDO = await this.toolLaunchService.getLaunchData(contextExternalToolDO);
		const launchRequestDO: ToolLaunchRequestDO = this.toolLaunchService.generateLaunchRequest(toolLaunchDataDO);
		return launchRequestDO;
	}
}
