import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ContextExternalToolDO, EntityId, ExternalToolDO, SchoolExternalToolDO } from '@shared/domain';
import { ToolConfigType } from '../../interface';
import { ExternalToolService, SchoolExternalToolService } from '../../service';
import { ToolLaunchMapper } from '../mapper';
import { ToolLaunchData, ToolLaunchRequest } from '../types';
import { BasicToolLaunchStrategy, IToolLaunchStrategy, Lti11ToolLaunchStrategy } from './strategy';

@Injectable()
export class ToolLaunchService {
	private strategies: Map<ToolConfigType, IToolLaunchStrategy>;

	constructor(
		private readonly schoolExternalToolService: SchoolExternalToolService,
		private readonly externalToolService: ExternalToolService,
		private readonly basicToolLaunchStrategy: BasicToolLaunchStrategy,
		private readonly lti11ToolLaunchStrategy: Lti11ToolLaunchStrategy
	) {
		this.strategies = new Map();
		this.strategies.set(ToolConfigType.BASIC, basicToolLaunchStrategy);
		this.strategies.set(ToolConfigType.LTI11, lti11ToolLaunchStrategy);
	}

	generateLaunchRequest(toolLaunchData: ToolLaunchData): ToolLaunchRequest {
		const toolConfigType: ToolConfigType = ToolLaunchMapper.mapToToolConfigType(toolLaunchData.type);
		const strategy: IToolLaunchStrategy | undefined = this.strategies.get(toolConfigType);

		if (!strategy) {
			throw new InternalServerErrorException('Unknown tool launch data type');
		}

		const launchRequest: ToolLaunchRequest = strategy.createLaunchRequest(toolLaunchData);

		return launchRequest;
	}

	async getLaunchData(userId: EntityId, contextExternalToolDO: ContextExternalToolDO): Promise<ToolLaunchData> {
		const schoolExternalToolId: EntityId = contextExternalToolDO.schoolToolRef.schoolToolId;

		const { externalToolDO, schoolExternalToolDO } = await this.loadToolHierarchy(schoolExternalToolId);

		const strategy: IToolLaunchStrategy | undefined = this.strategies.get(externalToolDO.config.type);

		if (!strategy) {
			throw new InternalServerErrorException('Unknown tool config type');
		}

		const launchData: ToolLaunchData = await strategy.createLaunchData(userId, {
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
