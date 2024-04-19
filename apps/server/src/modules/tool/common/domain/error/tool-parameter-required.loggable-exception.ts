import { BusinessError } from '@shared/common';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';
import { HttpStatus } from '@nestjs/common';
import { CustomParameter } from '../custom-parameter.do';

export class ToolParameterRequiredLoggableException extends BusinessError implements Loggable {
	constructor(private readonly parameterDeclaration: CustomParameter) {
		super(
			{
				type: 'TOOL_PARAMETER_REQUIRED',
				title: 'Parameter is required',
				defaultMessage: 'The parameter is required, but not found in the tool.',
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
				parameterDeclaration: this.parameterDeclaration.name,
			},
		};
	}
}
