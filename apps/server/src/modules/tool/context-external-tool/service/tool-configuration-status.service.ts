import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { ValidationError } from '@shared/common';
import {
	ContextExternalToolConfigurationStatus,
	ToolParameterMandatoryValueMissingLoggableException,
	ToolParameterOptionalValueMissingLoggableException,
} from '../../common/domain';
import { CommonToolValidationService } from '../../common/service';
import { ExternalTool } from '../../external-tool/domain';
import { SchoolExternalTool } from '../../school-external-tool/domain';
import { ContextExternalToolLaunchable } from '../domain';

@Injectable()
export class ToolConfigurationStatusService {
	constructor(private readonly commonToolValidationService: CommonToolValidationService) {}

	public determineToolConfigurationStatus(
		externalTool: ExternalTool,
		schoolExternalTool: SchoolExternalTool,
		contextExternalTool: ContextExternalToolLaunchable
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
			} else if (this.isIncompleteOperational(contextParameterErrors) && !this.isOutdated(contextParameterErrors)) {
				configurationStatus.isIncompleteOperationalOnScopeContext = true;
				configurationStatus.isOutdatedOnScopeContext = false;
			} else if (this.isIncompleteOperational(contextParameterErrors) && this.isOutdated(contextParameterErrors)) {
				configurationStatus.isIncompleteOperationalOnScopeContext = true;
			}
		}

		return configurationStatus;
	}

	private isToolDeactivated(externalTool: ExternalTool, schoolExternalTool: SchoolExternalTool) {
		return !!(externalTool.isDeactivated || (schoolExternalTool.status && schoolExternalTool.status.isDeactivated));
	}

	private isIncompleteOperational(errors: ValidationError[]) {
		return errors.some((error: ValidationError) => error instanceof ToolParameterOptionalValueMissingLoggableException);
	}

	private isOutdated(contextParameterErrors: ValidationError[]): boolean {
		const parameterWithoutOptional: ValidationError[] = contextParameterErrors.filter(
			(error: ValidationError) => !this.isOptional(error)
		);

		return parameterWithoutOptional.length > 0;
	}

	isOptional(error: ValidationError): boolean {
		return error instanceof ToolParameterOptionalValueMissingLoggableException;
	}
}
