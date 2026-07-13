import { NotImplementedException } from '@nestjs/common';
import { type Loggable, type LoggableMessage } from '@shared/common/loggable';

export class ParameterTypeNotImplementedLoggableException extends NotImplementedException implements Loggable {
	constructor(private readonly parameterType: string) {
		super();
	}

	public getLogMessage(): LoggableMessage {
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
