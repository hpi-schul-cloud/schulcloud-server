import { ValidationError } from '@shared/common';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';
import { CustomParameter } from '../custom-parameter.do';

export class ToolParameterValueRegexLoggableException extends ValidationError implements Loggable {
	constructor(private readonly parameterDeclaration: CustomParameter) {
		super(
			`tool_param_value_regex: The given entry for the parameter with name ${parameterDeclaration.name} does not fit the regex.`
		);
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: 'TOOL_PARAMETER_VALUE_REGEX',
			message: 'The parameter value does not fit the regex.',
			stack: this.stack,
			data: {
				parameterName: this.parameterDeclaration.name,
			},
		};
	}
}
