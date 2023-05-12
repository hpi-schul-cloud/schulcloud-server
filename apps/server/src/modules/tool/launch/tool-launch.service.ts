import { Injectable, InternalServerErrorException, NotImplementedException } from '@nestjs/common';
import {
	BasicToolConfigDO,
	ContextExternalToolDO,
	ExternalToolDO,
	ToolLaunchRequestDO,
	SchoolExternalToolDO,
	ToolLaunchDataDO,
	ToolLaunchDataType,
} from '@shared/domain';
import { ExternalToolService, SchoolExternalToolService } from '../service';
import { ToolConfigType } from '../interface';
import { BasicToolLaunchStrategy } from './strategy';

@Injectable()
export class ToolLaunchService {
	constructor(
		private readonly schoolExternalToolService: SchoolExternalToolService,
		private readonly externalToolService: ExternalToolService,
		private readonly basicToolLaunchStrategy: BasicToolLaunchStrategy
	) {}

	generateLaunchRequest(toolLaunchDataDO: ToolLaunchDataDO): ToolLaunchRequestDO {
		let launchRequest: ToolLaunchRequestDO;
		switch (toolLaunchDataDO.type) {
			case ToolLaunchDataType.BASIC:
				launchRequest = this.basicToolLaunchStrategy.createLaunchRequest(toolLaunchDataDO);
				break;

			case ToolLaunchDataType.LTI11:
				throw new NotImplementedException('LTI 1.1 launch is not implemented yet');

			case ToolLaunchDataType.OAUTH2:
				throw new NotImplementedException('OAuth2 launch is not implemented yet');

			default:
				throw new InternalServerErrorException('Unknown tool launch data type');
		}

		return launchRequest;
	}

	async getLaunchData(contextExternalToolDO: ContextExternalToolDO): Promise<ToolLaunchDataDO> {
		const schoolExternalToolId = contextExternalToolDO.schoolToolId;

		const { externalToolDO, schoolExternalToolDO } = await this.loadToolHierarchy(schoolExternalToolId);

		let launchData: ToolLaunchDataDO;
		switch (externalToolDO.config.type) {
			case ToolConfigType.BASIC:
				launchData = this.basicToolLaunchStrategy.createLaunchData({
					externalToolDO,
					schoolExternalToolDO,
					config: externalToolDO.config as BasicToolConfigDO,
					contextExternalToolDO,
				});
				break;

			case ToolConfigType.LTI11:
				throw new NotImplementedException('LTI 1.1 launch is not implemented yet');

			case ToolConfigType.OAUTH2:
				throw new NotImplementedException('OAuth2 launch is not implemented yet');

			default:
				throw new InternalServerErrorException('Unknown tool config type');
		}

		return launchData;
	}

	private async loadToolHierarchy(
		schoolExternalToolId: string
	): Promise<{ schoolExternalToolDO: SchoolExternalToolDO; externalToolDO: ExternalToolDO }> {
		const schoolExternalToolDO: SchoolExternalToolDO = await this.schoolExternalToolService.getSchoolExternalToolById(
			schoolExternalToolId
		);

		const externalToolDO: ExternalToolDO = await this.externalToolService.findExternalToolById(
			schoolExternalToolDO.toolId
		);

		return {
			schoolExternalToolDO,
			externalToolDO,
		};
	}
}
