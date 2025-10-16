import { UnprocessableEntityException } from '@nestjs/common';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@core/logger';
import { ToolConfigType } from '../../../common/enum';

export class InvalidToolTypeLoggableException extends UnprocessableEntityException implements Loggable {
	constructor(private readonly expected: ToolConfigType, private readonly received: ToolConfigType) {
		super();
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		const message: LogMessage | ErrorLogMessage | ValidationErrorLogMessage = {
			type: 'INVALID_TOOL_TYPE',
			message: 'The external tool has the wrong tool type.',
			stack: this.stack,
			data: {
				expected: this.expected,
				received: this.received,
			},
		};

		return message;
	}
}
