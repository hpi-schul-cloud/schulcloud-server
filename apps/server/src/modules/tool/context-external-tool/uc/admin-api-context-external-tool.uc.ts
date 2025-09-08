import { Injectable } from '@nestjs/common';
import { ContextExternalTool } from '../domain';
import { ContextExternalToolService } from '../service';
import { ContextExternalToolDto } from './dto/context-external-tool.types';

@Injectable()
export class AdminApiContextExternalToolUc {
	constructor(private readonly contextExternalToolService: ContextExternalToolService) {}

	async createContextExternalTool(contextExternalToolProps: ContextExternalToolDto): Promise<ContextExternalTool> {
		const contextExternalTool: ContextExternalTool = new ContextExternalTool(contextExternalToolProps);

		const createdTool: ContextExternalTool = await this.contextExternalToolService.saveContextExternalTool(
			contextExternalTool
		);

		return createdTool;
	}
}
