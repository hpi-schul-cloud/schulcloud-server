import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { Inject } from '@nestjs/common';
import { ContextExternalToolValidationService } from './context-external-tool-validation.service';
import { SchoolExternalToolValidationService } from '../../school-external-tool/service';
import { IToolFeatures, ToolFeatures } from '../../tool-config';
import { ExternalTool } from '../../external-tool/domain';
import { SchoolExternalTool } from '../../school-external-tool/domain';
import { ContextExternalTool } from '../domain';
import { ToolConfigurationStatus } from '../../common/enum';
import { CommonToolService } from '../../common/service';

@Injectable()
export class ToolVersionService {
	constructor(
		private readonly contextExternalToolValidationService: ContextExternalToolValidationService,
		private readonly schoolExternalToolValidationService: SchoolExternalToolValidationService,
		private readonly commonToolService: CommonToolService,
		@Inject(ToolFeatures) private readonly toolFeatures: IToolFeatures
	) {}

	async determineToolConfigurationStatus(
		externalTool: ExternalTool,
		schoolExternalTool: SchoolExternalTool,
		contextExternalTool: ContextExternalTool
	): Promise<ToolConfigurationStatus> {
		// TODO N21-1337 remove if statement, when feature flag is removed
		if (this.toolFeatures.toolStatusWithoutVersions) {
			const configurationStatus: ToolConfigurationStatus = new ToolConfigurationStatus({
				latest: true,
				isDisabled: false,
				isOutdatedOnScopeContext: false,
				isOutdatedOnScopeSchool: false,
				isUnkown: false,
			});

			try {
				await this.schoolExternalToolValidationService.validate(schoolExternalTool);
			} catch (err) {
				configurationStatus.latest = false;
				configurationStatus.isOutdatedOnScopeSchool = true;
			}

			try {
				await this.contextExternalToolValidationService.validate(contextExternalTool);
			} catch (err) {
				configurationStatus.latest = false;
				configurationStatus.isOutdatedOnScopeContext = true;
			}

			return configurationStatus;
		}
		const status: ToolConfigurationStatus = this.commonToolService.determineToolConfigurationStatus(
			externalTool,
			schoolExternalTool,
			contextExternalTool
		);

		return status;
	}
}
