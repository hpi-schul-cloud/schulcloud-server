import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { ValidationError } from '@shared/common';
import {
	ContextExternalToolConfigurationStatus,
	ToolParameterMandatoryValueMissingLoggableException,
} from '../../common/domain';
import { ToolParameterOptionalValueMissingLoggableException } from '../../common/domain/error/tool-parameter-optional-value-missing-loggable-exception';
import { CommonToolValidationService } from '../../common/service';
import { ExternalTool } from '../../external-tool/domain';
import { SchoolExternalTool } from '../../school-external-tool/domain';
import { ContextExternalTool } from '../domain';

@Injectable()
export class ToolConfigurationStatusService {
	constructor(private readonly commonToolValidationService: CommonToolValidationService) {}

	public determineToolConfigurationStatus(
		externalTool: ExternalTool,
		schoolExternalTool: SchoolExternalTool,
		contextExternalTool: ContextExternalTool
	): ContextExternalToolConfigurationStatus {
		const configurationStatus: ContextExternalToolConfigurationStatus = new ContextExternalToolConfigurationStatus({
			isOutdatedOnScopeContext: false,
			isIncompleteOnScopeContext: false,
			isIncompleteOperationalOnScopeContext: false,
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
					(error: ValidationError) => error instanceof ToolParameterMandatoryValueMissingLoggableException
				)
			) {
				configurationStatus.isIncompleteOnScopeContext = true;
			} else if (
				contextParameterErrors.some(
					(error: ValidationError) => error instanceof ToolParameterOptionalValueMissingLoggableException
				)
			) {
				configurationStatus.isIncompleteOperationalOnScopeContext = true;
			}
		}

		return configurationStatus;
	}

	private isToolDeactivated(externalTool: ExternalTool, schoolExternalTool: SchoolExternalTool) {
		if (externalTool.isDeactivated || (schoolExternalTool.status && schoolExternalTool.status.isDeactivated)) {
			return true;
		}

		return false;
	}
}
