import { BusinessError } from '@shared/common';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';
import { HttpStatus } from '@nestjs/common';
import { CustomParameter } from '../custom-parameter.do';

export class ToolParameterValueMissingLoggableException extends BusinessError implements Loggable {
	constructor(private readonly parameterDeclaration: CustomParameter) {
		super(
			{
				type: 'TOOL_PARAMETER_VALUE_MISSING',
				title: 'Missing tool parameter value',
				defaultMessage: 'The parameter has no value.',
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
