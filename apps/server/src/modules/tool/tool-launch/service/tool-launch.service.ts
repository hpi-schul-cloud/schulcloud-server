import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { EntityId } from '@shared/domain';
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
import { ToolConfigType, ToolConfigurationStatus } from '../../common/enum';
import { ContextExternalTool } from '../../context-external-tool/domain';
import { ExternalTool } from '../../external-tool/domain';
import { SchoolExternalTool } from '../../school-external-tool/domain';

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
		const schoolExternalTool: SchoolExternalTool = await this.schoolExternalToolService.getSchoolExternalToolById(
			schoolExternalToolId
		);

		const externalTool: ExternalTool = await this.externalToolService.findExternalToolById(schoolExternalTool.toolId);

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
