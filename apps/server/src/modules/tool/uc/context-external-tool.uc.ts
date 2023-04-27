import { Injectable } from '@nestjs/common';
import { EntityId, ContextExternalToolDO } from '@shared/domain';
import { ContextExternalTool } from './dto';
import { ContextExternalToolService } from '../service';

@Injectable()
export class ContextExternalToolUc {
	constructor(private readonly contextExternalToolService: ContextExternalToolService) {}

	// TODO: testme
	async createContextExternalTool(
		userId: EntityId,
		contextExternalTool: ContextExternalTool
	): Promise<ContextExternalToolDO> {
		const createdTool: ContextExternalToolDO = await this.contextExternalToolService.createContextExternalTool(
			contextExternalTool
		);
		return createdTool;
	}
}
