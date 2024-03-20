import { ValidationError } from '@shared/common';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';
import { CustomParameter } from '../custom-parameter.do';

export class ToolParameterRequiredLoggableException extends ValidationError implements Loggable {
	constructor(private readonly parameterDeclaration: CustomParameter) {
		super(
			`tool_param_required: The parameter with name ${parameterDeclaration.name} is required but not found in the tool.`
		);
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: 'TOOL_PARAMETER_REQUIRED',
			message: 'The parameter is required, but not found in the tool.',
			stack: this.stack,
			data: {
				parameterName: this.parameterDeclaration.name,
			},
		};
	}
}
