import { BusinessError } from '@shared/common';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';
import { HttpStatus } from '@nestjs/common';

export class ToolParameterDuplicateLoggableException extends BusinessError implements Loggable {
	constructor(private readonly parameterName: string) {
		super(
			{
				type: 'TOOL_PARAMETER_DUPLICATE',
				title: 'Duplicate tool parameter',
				defaultMessage: 'The parameter is defined multiple times.',
			},
			HttpStatus.BAD_REQUEST,
			{
				parameterName,
			}
		);
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: this.type,
			message: this.message,
			stack: this.stack,
			data: {
				parameterName: this.parameterName,
			},
		};
	}
}
