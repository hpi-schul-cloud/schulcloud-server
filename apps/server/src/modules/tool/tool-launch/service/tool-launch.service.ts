import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { Configuration } from '@hpi-schul-cloud/commons';
import { ToolConfigType, ToolConfigurationStatus } from '../../common/enum';
import { CommonToolService } from '../../common/service';
import { ContextExternalTool } from '../../context-external-tool/domain';
import { ExternalTool } from '../../external-tool/domain';
import { ExternalToolService } from '../../external-tool/service';
import { SchoolExternalTool } from '../../school-external-tool/domain';
import { SchoolExternalToolService, SchoolExternalToolValidationService } from '../../school-external-tool/service';
import { ToolStatusOutdatedLoggableException } from '../error';
import { ToolLaunchMapper } from '../mapper';
import { ToolLaunchData, ToolLaunchRequest } from '../types';
import {
	BasicToolLaunchStrategy,
	IToolLaunchStrategy,
	Lti11ToolLaunchStrategy,
	OAuth2ToolLaunchStrategy,
} from './launch-strategy';
import { ContextExternalToolValidationService } from '../../context-external-tool/service';

@Injectable()
export class ToolLaunchService {
	private strategies: Map<ToolConfigType, IToolLaunchStrategy>;

	constructor(
		private readonly schoolExternalToolService: SchoolExternalToolService,
		private readonly externalToolService: ExternalToolService,
		private readonly basicToolLaunchStrategy: BasicToolLaunchStrategy,
		private readonly lti11ToolLaunchStrategy: Lti11ToolLaunchStrategy,
		private readonly oauth2ToolLaunchStrategy: OAuth2ToolLaunchStrategy,
		private readonly commonToolService: CommonToolService,
		private readonly contextExternalToolValidationService: ContextExternalToolValidationService,
		private readonly schoolExternalToolValidationService: SchoolExternalToolValidationService
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

		await this.isToolStatusLatestOrThrow(userId, externalTool, schoolExternalTool, contextExternalTool);

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

	private async determineToolConfigurationStatusThroughValidation(
		schoolExternalTool: SchoolExternalTool,
		contextExternalTool: ContextExternalTool
	): Promise<ToolConfigurationStatus> {
		try {
			await this.schoolExternalToolValidationService.validate(schoolExternalTool);
			await this.contextExternalToolValidationService.validate(contextExternalTool);
			return ToolConfigurationStatus.LATEST;
		} catch (err) {
			return ToolConfigurationStatus.OUTDATED;
		}
	}

	private async isToolStatusLatestOrThrow(
		userId: EntityId,
		externalTool: ExternalTool,
		schoolExternalTool: SchoolExternalTool,
		contextExternalTool: ContextExternalTool
	): Promise<void> {
		let status: ToolConfigurationStatus;

		if (Configuration.get('FEATURE_COMPUTE_TOOL_STATUS_WITHOUT_VERSIONS_ENABLED')) {
			status = await this.determineToolConfigurationStatusThroughValidation(schoolExternalTool, contextExternalTool);
		} else {
			status = this.commonToolService.determineToolConfigurationStatus(
				externalTool,
				schoolExternalTool,
				contextExternalTool
			);
		}

		if (status !== ToolConfigurationStatus.LATEST) {
			throw new ToolStatusOutdatedLoggableException(userId, contextExternalTool.id ?? '');
		}
	}
}
