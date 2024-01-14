import { ValidationError } from '@shared/common';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';

export class ToolParameterDuplicateLoggableException extends ValidationError implements Loggable {
	constructor(private readonly parameterName: string) {
		super(`tool_param_duplicate: The parameter with name ${parameterName} is defined multiple times.`);
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: 'TOOL_PARAMETER_DUPLICATE',
			message: 'The parameter is defined multiple times.',
			stack: this.stack,
			data: {
				parameterName: this.parameterName,
			},
		};
	}
}
