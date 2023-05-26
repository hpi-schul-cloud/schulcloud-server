import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ContextExternalToolDO, ExternalToolDO, SchoolExternalToolDO } from '@shared/domain';
import { ExternalToolService, SchoolExternalToolService } from '../../service';
import { ToolConfigType } from '../../interface';
import { BasicToolLaunchStrategy, IToolLaunchStrategy } from './strategy';
import { ToolLaunchData, ToolLaunchRequest } from '../types';
import { ToolLaunchMapper } from '../mapper';

@Injectable()
export class ToolLaunchService {
	private strategies: Map<ToolConfigType, IToolLaunchStrategy>;

	constructor(
		private readonly schoolExternalToolService: SchoolExternalToolService,
		private readonly externalToolService: ExternalToolService,
		@Inject(BasicToolLaunchStrategy) private basicToolLaunchStrategy: IToolLaunchStrategy
	) {
		this.strategies = new Map();
		this.strategies.set(ToolConfigType.BASIC, basicToolLaunchStrategy);
	}

	generateLaunchRequest(toolLaunchDataDO: ToolLaunchData): ToolLaunchRequest {
		const toolConfigType: ToolConfigType = ToolLaunchMapper.mapToToolConfigType(toolLaunchDataDO.type);
		const strategy = this.strategies.get(toolConfigType);

		if (!strategy) {
			throw new InternalServerErrorException('Unknown tool launch data type');
		}

		const launchRequest: ToolLaunchRequest = strategy.createLaunchRequest(toolLaunchDataDO);

		return launchRequest;
	}

	async getLaunchData(contextExternalToolDO: ContextExternalToolDO): Promise<ToolLaunchData> {
		const schoolExternalToolId = contextExternalToolDO.schoolToolRef.schoolToolId;

		const { externalToolDO, schoolExternalToolDO } = await this.loadToolHierarchy(schoolExternalToolId);

		const strategy = this.strategies.get(externalToolDO.config.type);
		if (!strategy) {
			throw new InternalServerErrorException('Unknown tool config type');
		}

		const launchData: ToolLaunchData = strategy.createLaunchData({
			externalToolDO,
			schoolExternalToolDO,
			contextExternalToolDO,
		});

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
