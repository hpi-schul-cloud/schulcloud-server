import { Injectable } from '@nestjs/common';
import { ContextExternalToolLaunchable } from '@src/modules/tool/context-external-tool/domain';
import { SchoolExternalTool } from '@src/modules/tool/school-external-tool/domain';
import { ExternalTool } from '../../../external-tool/domain';
import { ExternalToolService } from '../../../external-tool/service';
import { AutoParameterStrategy } from './auto-parameter.strategy';

@Injectable()
export class AutoMediumIdStrategy implements AutoParameterStrategy {
	constructor(private readonly externalToolService: ExternalToolService) {}

	async getValue(
		schoolExternalTool: SchoolExternalTool,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		contextExternalTool: ContextExternalToolLaunchable
	): Promise<string | undefined> {
		const externalTool: ExternalTool = await this.externalToolService.findById(schoolExternalTool.toolId);
		return externalTool.medium?.mediumId;
	}
}
