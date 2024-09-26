import { BadRequestException } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { Loggable } from '@src/core/logger/interfaces';
import { ErrorLogMessage } from '@src/core/logger/types';

export class AccountSystemMismatchLoggableException extends BadRequestException implements Loggable {
	constructor(private readonly expectedSystemId?: EntityId, private readonly receivedSystemId?: EntityId) {
		super();
	}

	getLogMessage(): ErrorLogMessage {
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
