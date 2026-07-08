import { BadRequestException } from '@nestjs/common';
import { type Loggable, type LoggableMessage } from '@shared/common/loggable';
import { type EntityId } from '@shared/domain/types';

export class AccountSystemMismatchLoggableException extends BadRequestException implements Loggable {
	constructor(
		private readonly expectedSystemId?: EntityId,
		private readonly receivedSystemId?: EntityId
	) {
		super();
	}

	public getLogMessage(): LoggableMessage {
		return {
			type: 'LOGIN_SYSTEM_MISMATCH',
			stack: this.stack,
			data: {
				expected: this.expectedSystemId,
				received: this.receivedSystemId,
			},
		};
	}
}
