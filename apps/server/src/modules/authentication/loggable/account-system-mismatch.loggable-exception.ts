import { ErrorLogMessage, Loggable } from '@infra/logger';
import { BadRequestException } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';

export class AccountSystemMismatchLoggableException extends BadRequestException implements Loggable {
	constructor(
		private readonly expectedSystemId?: EntityId,
		private readonly receivedSystemId?: EntityId
	) {
		super();
	}

	public getLogMessage(): ErrorLogMessage {
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
