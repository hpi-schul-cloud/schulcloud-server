import { BusinessError } from '@shared/common';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';
import { HttpStatus } from '@nestjs/common';
import { CustomParameter } from '../custom-parameter.do';

export class ToolParameterValueRegexLoggableException extends BusinessError implements Loggable {
	constructor(private readonly parameterDeclaration: CustomParameter) {
		super(
			{
				type: 'TOOL_PARAMETER_VALUE_REGEX',
				title: 'Tool parameter value is no regex',
				defaultMessage: 'The parameter value does not fit the regex.',
			},
			HttpStatus.BAD_REQUEST,
			{
				parameterDeclaration,
			}
		);
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: this.type,
			message: this.message,
			stack: this.stack,
			data: {
				parameterName: this.parameterDeclaration.name,
			},
		};
	}
}
