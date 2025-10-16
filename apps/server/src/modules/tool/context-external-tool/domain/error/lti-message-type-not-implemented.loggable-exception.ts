import { NotImplementedException } from '@nestjs/common';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@core/logger';

export class LtiMessageTypeNotImplementedLoggableException extends NotImplementedException implements Loggable {
	constructor(private readonly ltiMessageType: string) {
		super();
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		const message: LogMessage | ErrorLogMessage | ValidationErrorLogMessage = {
			type: 'LTI_MESSAGE_TYPE_NOT_IMPLEMENTED',
			message: 'The lti message type is not implemented.',
			stack: this.stack,
			data: {
				lti_message_type: this.ltiMessageType,
			},
		};

		return message;
	}
}
