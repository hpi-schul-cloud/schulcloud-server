import { ValidationError } from '@shared/common';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';
import { CustomParameter } from '../custom-parameter.do';

export class ToolParameterValueMissingLoggableException extends ValidationError implements Loggable {
	constructor(private readonly parameterDeclaration: CustomParameter) {
		super(`tool_param_value_missing: The parameter with name ${parameterDeclaration.name} has no value`);
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: 'TOOL_PARAMETER_VALUE_MISSING',
			message: 'The parameter has no value.',
			stack: this.stack,
			data: {
				parameterName: this.parameterDeclaration.name,
			},
		};
	}
}
