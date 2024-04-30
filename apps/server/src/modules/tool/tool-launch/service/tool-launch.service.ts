import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { ContextExternalToolConfigurationStatus } from '../../common/domain';
import { ToolConfigType } from '../../common/enum';
import { ContextExternalTool } from '../../context-external-tool/domain';
import { ToolConfigurationStatusService } from '../../context-external-tool/service/tool-configuration-status.service';
import { ExternalTool } from '../../external-tool/domain';
import { ExternalToolService } from '../../external-tool/service';
import { SchoolExternalTool } from '../../school-external-tool/domain';
import { SchoolExternalToolService } from '../../school-external-tool/service';
import { ToolStatusOutdatedLoggableException } from '../error';
import { ToolLaunchMapper } from '../mapper';
import { ToolLaunchData, ToolLaunchRequest } from '../types';
import {
	BasicToolLaunchStrategy,
	Lti11ToolLaunchStrategy,
	OAuth2ToolLaunchStrategy,
	ToolLaunchStrategy,
} from './launch-strategy';

@Injectable()
export class ToolLaunchService {
	private strategies: Map<ToolConfigType, ToolLaunchStrategy>;

	constructor(
		private readonly schoolExternalToolService: SchoolExternalToolService,
		private readonly externalToolService: ExternalToolService,
		private readonly basicToolLaunchStrategy: BasicToolLaunchStrategy,
		private readonly lti11ToolLaunchStrategy: Lti11ToolLaunchStrategy,
		private readonly oauth2ToolLaunchStrategy: OAuth2ToolLaunchStrategy,
		private readonly toolVersionService: ToolConfigurationStatusService
	) {
		this.strategies = new Map();
		this.strategies.set(ToolConfigType.BASIC, basicToolLaunchStrategy);
		this.strategies.set(ToolConfigType.LTI11, lti11ToolLaunchStrategy);
		this.strategies.set(ToolConfigType.OAUTH2, oauth2ToolLaunchStrategy);
	}

	generateLaunchRequest(toolLaunchData: ToolLaunchData): ToolLaunchRequest {
		const toolConfigType: ToolConfigType = ToolLaunchMapper.mapToToolConfigType(toolLaunchData.type);
		const strategy: ToolLaunchStrategy | undefined = this.strategies.get(toolConfigType);

		if (!strategy) {
			throw new InternalServerErrorException('Unknown tool launch data type');
		}

		const launchRequest: ToolLaunchRequest = strategy.createLaunchRequest(toolLaunchData);

		return launchRequest;
	}

	async getLaunchData(userId: EntityId, contextExternalTool: ContextExternalTool): Promise<ToolLaunchData> {
		const schoolExternalToolId: EntityId = contextExternalTool.schoolToolRef.schoolToolId;

		const { externalTool, schoolExternalTool } = await this.loadToolHierarchy(schoolExternalToolId);

		this.isToolStatusLaunchableOrThrow(userId, externalTool, schoolExternalTool, contextExternalTool);

		const strategy: ToolLaunchStrategy | undefined = this.strategies.get(externalTool.config.type);

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

	private isToolStatusLaunchableOrThrow(
		userId: EntityId,
		externalTool: ExternalTool,
		schoolExternalTool: SchoolExternalTool,
		contextExternalTool: ContextExternalTool
	): void {
		const status: ContextExternalToolConfigurationStatus = this.toolVersionService.determineToolConfigurationStatus(
			externalTool,
			schoolExternalTool,
			contextExternalTool
		);

		if (
			status.isOutdatedOnScopeSchool ||
			status.isOutdatedOnScopeContext ||
			status.isDeactivated ||
			status.isIncompleteOnScopeContext
		) {
			throw new ToolStatusOutdatedLoggableException(
				userId,
				contextExternalTool.id ?? '',
				status.isOutdatedOnScopeSchool,
				status.isOutdatedOnScopeContext,
				status.isIncompleteOnScopeContext,
				status.isIncompleteOperationalOnScopeContext,
				status.isDeactivated
			);
		}
	}
}
