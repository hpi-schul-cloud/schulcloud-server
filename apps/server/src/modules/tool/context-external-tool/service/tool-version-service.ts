import { Inject } from '@nestjs/common';
import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { ContextExternalToolConfigurationStatus } from '../../common/domain';
import { CommonToolService } from '../../common/service';
import { ExternalTool } from '../../external-tool/domain';
import { SchoolExternalTool } from '../../school-external-tool/domain';
import { SchoolExternalToolValidationService } from '../../school-external-tool/service';
import { IToolFeatures, ToolFeatures } from '../../tool-config';
import { ContextExternalTool } from '../domain';
import { ContextExternalToolValidationService } from './context-external-tool-validation.service';

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
	): Promise<ContextExternalToolConfigurationStatus> {
		// TODO N21-1337 remove if statement, when feature flag is removed
		if (this.toolFeatures.toolStatusWithoutVersions) {
			const configurationStatus: ContextExternalToolConfigurationStatus = new ContextExternalToolConfigurationStatus({
				isOutdatedOnScopeContext: false,
				isOutdatedOnScopeSchool: false,
				isDeactivated: false,
			});

			if (externalTool.isDeactivated || (schoolExternalTool.status && schoolExternalTool.status.isDeactivated)) {
				configurationStatus.isDeactivated = true;
			}

			try {
				await this.schoolExternalToolValidationService.validate(schoolExternalTool);
			} catch (err) {
				configurationStatus.isOutdatedOnScopeSchool = true;
			}

			try {
				await this.contextExternalToolValidationService.validate(contextExternalTool);
			} catch (err) {
				configurationStatus.isOutdatedOnScopeContext = true;
			}

			return configurationStatus;
		}
		const status: ContextExternalToolConfigurationStatus = this.commonToolService.determineToolConfigurationStatus(
			externalTool,
			schoolExternalTool,
			contextExternalTool
		);

		return status;
	}
}
