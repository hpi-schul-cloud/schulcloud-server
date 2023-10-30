import { NotImplementedException } from '@nestjs/common';
import { Loggable } from '@src/core/logger/interfaces/loggable';
import { ErrorLogMessage, LogMessage, ValidationErrorLogMessage } from '@src/core/logger/types/logging.types';

export class ParameterTypeNotImplementedLoggableException extends NotImplementedException implements Loggable {
	constructor(private readonly parameterType: string) {
		super();
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: 'PARAMETER_TYPE_NOT_IMPLEMENTED',
			message: 'Launching an external tool with this parameter type is not implemented.',
			stack: this.stack,
			data: {
				parameterType: this.parameterType,
			},
		};
	}
}
