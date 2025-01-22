import { NotImplementedException } from '@nestjs/common';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@core/logger';

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
