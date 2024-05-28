import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { ContextExternalToolConfigurationStatus } from '../../common/domain';
import { ToolConfigType } from '../../common/enum';
import { ContextExternalToolLaunchable } from '../../context-external-tool/domain';
import { ToolConfigurationStatusService } from '../../context-external-tool/service';
import { ExternalToolService } from '../../external-tool';
import { ExternalTool } from '../../external-tool/domain';
import { SchoolExternalToolService } from '../../school-external-tool';
import { SchoolExternalTool } from '../../school-external-tool/domain';
import { ToolStatusNotLaunchableLoggableException } from '../error';
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
		private readonly toolConfigurationStatusService: ToolConfigurationStatusService
	) {
		this.strategies = new Map();
		this.strategies.set(ToolConfigType.BASIC, basicToolLaunchStrategy);
		this.strategies.set(ToolConfigType.LTI11, lti11ToolLaunchStrategy);
		this.strategies.set(ToolConfigType.OAUTH2, oauth2ToolLaunchStrategy);
	}

	public generateLaunchRequest(toolLaunchData: ToolLaunchData): ToolLaunchRequest {
		const toolConfigType: ToolConfigType = ToolLaunchMapper.mapToToolConfigType(toolLaunchData.type);
		const strategy: ToolLaunchStrategy | undefined = this.strategies.get(toolConfigType);

		if (!strategy) {
			throw new InternalServerErrorException('Unknown tool launch data type');
		}

		const launchRequest: ToolLaunchRequest = strategy.createLaunchRequest(toolLaunchData);

		return launchRequest;
	}

	public async getLaunchData(
		userId: EntityId,
		contextExternalTool: ContextExternalToolLaunchable
	): Promise<ToolLaunchData> {
		const schoolExternalToolId: EntityId = contextExternalTool.schoolToolRef.schoolToolId;

		const { externalTool, schoolExternalTool } = await this.loadToolHierarchy(schoolExternalToolId);

		await this.isToolStatusLaunchableOrThrow(userId, externalTool, schoolExternalTool, contextExternalTool);

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

	public async loadToolHierarchy(
		schoolExternalToolId: string
	): Promise<{ schoolExternalTool: SchoolExternalTool; externalTool: ExternalTool }> {
		const schoolExternalTool: SchoolExternalTool = await this.schoolExternalToolService.findById(schoolExternalToolId);

		const externalTool: ExternalTool = await this.externalToolService.findById(schoolExternalTool.toolId);

		return {
			schoolExternalTool,
			externalTool,
		};
	}

	private async isToolStatusLaunchableOrThrow(
		userId: EntityId,
		externalTool: ExternalTool,
		schoolExternalTool: SchoolExternalTool,
		contextExternalTool: ContextExternalToolLaunchable
	): Promise<void> {
		const status: ContextExternalToolConfigurationStatus =
			await this.toolConfigurationStatusService.determineToolConfigurationStatus(
				externalTool,
				schoolExternalTool,
				contextExternalTool,
				userId
			);

		if (
			status.isOutdatedOnScopeSchool ||
			status.isOutdatedOnScopeContext ||
			status.isDeactivated ||
			status.isNotLicensed ||
			status.isIncompleteOnScopeContext
		) {
			throw new ToolStatusNotLaunchableLoggableException(
				userId,
				contextExternalTool.id ?? '',
				status.isOutdatedOnScopeSchool,
				status.isOutdatedOnScopeContext,
				status.isIncompleteOnScopeContext,
				status.isIncompleteOperationalOnScopeContext,
				status.isDeactivated,
				status.isNotLicensed
			);
		}
	}
}
