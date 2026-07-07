import { UnprocessableEntityException } from '@nestjs/common';
import { type Loggable, type LoggableMessage } from '@shared/common/loggable';
import { type ToolConfigType } from '../../../common/enum';

export class InvalidToolTypeLoggableException extends UnprocessableEntityException implements Loggable {
	constructor(
		private readonly expected: ToolConfigType,
		private readonly received: ToolConfigType
	) {
		super();
	}

	getLogMessage(): LoggableMessage {
		const message: LoggableMessage = {
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
