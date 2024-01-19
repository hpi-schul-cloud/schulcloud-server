import { Inject } from '@nestjs/common';
import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { ValidationError } from '@shared/common';
import {
	ContextExternalToolConfigurationStatus,
	ToolParameterValueMissingLoggableException,
} from '../../common/domain';
import { CommonToolService, CommonToolValidationService } from '../../common/service';
import { ExternalTool } from '../../external-tool/domain';
import { SchoolExternalTool } from '../../school-external-tool/domain';
import { IToolFeatures, ToolFeatures } from '../../tool-config';
import { ContextExternalTool } from '../domain';

@Injectable()
export class ToolVersionService {
	constructor(
		private readonly commonToolService: CommonToolService,
		private readonly commonToolValidationService: CommonToolValidationService,
		@Inject(ToolFeatures) private readonly toolFeatures: IToolFeatures
	) {}

	public determineToolConfigurationStatus(
		externalTool: ExternalTool,
		schoolExternalTool: SchoolExternalTool,
		contextExternalTool: ContextExternalTool
	): ContextExternalToolConfigurationStatus {
		// TODO N21-1337 remove if statement, when feature flag is removed
		if (this.toolFeatures.toolStatusWithoutVersions) {
			const configurationStatus: ContextExternalToolConfigurationStatus = new ContextExternalToolConfigurationStatus({
				isOutdatedOnScopeContext: false,
				isIncompleteOnScopeContext: false,
				isOutdatedOnScopeSchool: false,
				isDeactivated: this.isToolDeactivated(externalTool, schoolExternalTool),
			});

			const schoolParameterErrors: ValidationError[] = this.commonToolValidationService.validateParameters(
				externalTool,
				schoolExternalTool
			);

			if (schoolParameterErrors.length) {
				configurationStatus.isOutdatedOnScopeSchool = true;
			}

			const contextParameterErrors: ValidationError[] = this.commonToolValidationService.validateParameters(
				externalTool,
				contextExternalTool
			);

			if (contextParameterErrors.length) {
				configurationStatus.isOutdatedOnScopeContext = true;

				if (
					contextParameterErrors.some(
						(error: ValidationError) => error instanceof ToolParameterValueMissingLoggableException
					)
				) {
					configurationStatus.isIncompleteOnScopeContext = true;
				}
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

	private isToolDeactivated(externalTool: ExternalTool, schoolExternalTool: SchoolExternalTool) {
		if (externalTool.isDeactivated || (schoolExternalTool.status && schoolExternalTool.status.isDeactivated)) {
			return true;
		}

		return false;
	}
}
