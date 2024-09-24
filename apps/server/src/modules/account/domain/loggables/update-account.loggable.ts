import { InternalServerErrorException } from '@nestjs/common';
import { ErrorLogMessage, Loggable } from '@src/core/logger';

export class UpdateAccountLoggableException extends InternalServerErrorException implements Loggable {
	constructor(private readonly type: string, private readonly error?: unknown) {
		super('ENTITY_NOT_FOUND_EXCEPTION');
	}

	getLogMessage(): ErrorLogMessage {
		const message: ErrorLogMessage = {
			type: this.type,
			stack: this.stack,
			error: (this.error as Error) ?? {},
			data: {},
		};

		return message;
	}
}
