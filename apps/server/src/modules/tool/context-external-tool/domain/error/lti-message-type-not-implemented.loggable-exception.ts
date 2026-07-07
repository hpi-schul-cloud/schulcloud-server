import { NotImplementedException } from '@nestjs/common';
import { type Loggable, type LoggableMessage } from '@shared/common/loggable';

export class LtiMessageTypeNotImplementedLoggableException extends NotImplementedException implements Loggable {
	constructor(private readonly ltiMessageType: string) {
		super();
	}

	getLogMessage(): LoggableMessage {
		const message: LoggableMessage = {
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
