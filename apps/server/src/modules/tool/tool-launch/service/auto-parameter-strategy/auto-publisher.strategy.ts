import { ContextExternalToolLaunchable } from '@modules/tool/context-external-tool/domain';
import { SchoolExternalTool } from '@modules/tool/school-external-tool/domain';
import { Injectable } from '@nestjs/common';
import { ExternalTool } from '../../../external-tool/domain';
import { ExternalToolService } from '../../../external-tool/service';
import { AutoParameterStrategy } from './auto-parameter.strategy';

@Injectable()
export class AutoPublisherStrategy implements AutoParameterStrategy {
	constructor(private readonly externalToolService: ExternalToolService) {}

	async getValue(
		schoolExternalTool: SchoolExternalTool,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		contextExternalTool: ContextExternalToolLaunchable
	): Promise<string | undefined> {
		const externalTool: ExternalTool = await this.externalToolService.findById(schoolExternalTool.toolId);
		return externalTool.medium?.publisher;
	}
}
