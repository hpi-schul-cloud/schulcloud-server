import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { EntityId } from '@shared/domain/types/entity-id';
import { ToolConfigType } from '../../common/enum/tool-config-type.enum';
import { ToolConfigurationStatus } from '../../common/enum/tool-configuration-status';
import { CommonToolService } from '../../common/service/common-tool.service';
import { ContextExternalTool } from '../../context-external-tool/domain/context-external-tool.do';
import { ExternalTool } from '../../external-tool/domain/external-tool.do';
import { ExternalToolService } from '../../external-tool/service/external-tool.service';
import { SchoolExternalTool } from '../../school-external-tool/domain/school-external-tool.do';
import { SchoolExternalToolService } from '../../school-external-tool/service/school-external-tool.service';
import { ToolStatusOutdatedLoggableException } from '../error/tool-status-outdated.loggable-exception';
import { ToolLaunchMapper } from '../mapper/tool-launch.mapper';
import { ToolLaunchData } from '../types/tool-launch-data';
import { ToolLaunchRequest } from '../types/tool-launch-request';
import { BasicToolLaunchStrategy } from './strategy/basic-tool-launch.strategy';
import { Lti11ToolLaunchStrategy } from './strategy/lti11-tool-launch.strategy';
import { OAuth2ToolLaunchStrategy } from './strategy/oauth2-tool-launch.strategy';
import { IToolLaunchStrategy } from './strategy/tool-launch-strategy.interface';

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

	async getLaunchData(userId: EntityId, contextExternalTool: ContextExternalTool): Promise<ToolLaunchData> {
		const schoolExternalToolId: EntityId = contextExternalTool.schoolToolRef.schoolToolId;

		const { externalTool, schoolExternalTool } = await this.loadToolHierarchy(schoolExternalToolId);

		this.isToolStatusLatestOrThrow(userId, externalTool, schoolExternalTool, contextExternalTool);

		const strategy: IToolLaunchStrategy | undefined = this.strategies.get(externalTool.config.type);

		if (!strategy) {
			throw new InternalServerErrorException('Unknown tool config type');
		}

		const launchData: ToolLaunchData = await strategy.createLaunchData(userId, {
			externalTool,
			schoolExternalTool,
			contextExternalTool,
		});

		return launchData;
	}

	private async loadToolHierarchy(
		schoolExternalToolId: string
	): Promise<{ schoolExternalTool: SchoolExternalTool; externalTool: ExternalTool }> {
		const schoolExternalTool: SchoolExternalTool = await this.schoolExternalToolService.findById(schoolExternalToolId);

		const externalTool: ExternalTool = await this.externalToolService.findById(schoolExternalTool.toolId);

		return {
			schoolExternalTool,
			externalTool,
		};
	}

	private isToolStatusLatestOrThrow(
		userId: EntityId,
		externalTool: ExternalTool,
		schoolExternalTool: SchoolExternalTool,
		contextExternalTool: ContextExternalTool
	): void {
		const status: ToolConfigurationStatus = this.commonToolService.determineToolConfigurationStatus(
			externalTool,
			schoolExternalTool,
			contextExternalTool
		);
		if (status !== ToolConfigurationStatus.LATEST) {
			throw new ToolStatusOutdatedLoggableException(userId, contextExternalTool.id ?? '');
		}
	}
}
