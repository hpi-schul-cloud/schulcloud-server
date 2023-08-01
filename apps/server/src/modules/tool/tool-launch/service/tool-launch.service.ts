import { Injectable, InternalServerErrorException } from '@nestjs/common';
import {
	ContextExternalToolDO,
	EntityId,
	ExternalToolDO,
	SchoolExternalToolDO,
	ToolConfigurationStatus,
} from '@shared/domain';
import { ToolConfigType } from '../../common/interface';
import { CommonToolService } from '../../common/service';
import { ToolLaunchMapper } from '../mapper';
import { ToolLaunchData, ToolLaunchRequest } from '../types';
import {
	BasicToolLaunchStrategy,
	IToolLaunchStrategy,
	Lti11ToolLaunchStrategy,
	OAuth2ToolLaunchStrategy,
} from './strategy';
import { ToolStatusOutdatedLoggableException } from '../error';
import { SchoolExternalToolService } from '../../school-external-tool/service';
import { ExternalToolService } from '../../external-tool/service';

@Injectable()
export class ToolLaunchService {
	private strategies: Map<ToolConfigType, IToolLaunchStrategy>;

	constructor(
		private readonly schoolExternalToolService: SchoolExternalToolService,
		private readonly externalToolService: ExternalToolService,
		private readonly basicToolLaunchStrategy: BasicToolLaunchStrategy,
		private readonly lti11ToolLaunchStrategy: Lti11ToolLaunchStrategy,
		private readonly oauth2ToolLaunchStrategy: OAuth2ToolLaunchStrategy,
		private readonly commonToolService: CommonToolService
	) {
		this.strategies = new Map();
		this.strategies.set(ToolConfigType.BASIC, basicToolLaunchStrategy);
		this.strategies.set(ToolConfigType.LTI11, lti11ToolLaunchStrategy);
		this.strategies.set(ToolConfigType.OAUTH2, oauth2ToolLaunchStrategy);
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

		this.isToolStatusLatestOrThrow(userId, externalToolDO, schoolExternalToolDO, contextExternalToolDO);

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

	private isToolStatusLatestOrThrow(
		userId: EntityId,
		externalToolDO: ExternalToolDO,
		schoolExternalToolDO: SchoolExternalToolDO,
		contextExternalToolDO: ContextExternalToolDO
	): void {
		const status: ToolConfigurationStatus = this.commonToolService.determineToolConfigurationStatus(
			externalToolDO,
			schoolExternalToolDO,
			contextExternalToolDO
		);
		if (status !== ToolConfigurationStatus.LATEST) {
			throw new ToolStatusOutdatedLoggableException(userId, contextExternalToolDO.id ?? '');
		}
	}
}
