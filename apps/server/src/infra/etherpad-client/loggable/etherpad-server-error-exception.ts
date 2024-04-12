import { InternalServerErrorException } from '@nestjs/common';
import { ErrorLogMessage, Loggable } from '@src/core/logger';
import { ErrorType, EtherpadParams } from '../interface';

export class EtherpadServerError extends InternalServerErrorException implements Loggable {
	constructor(
		private readonly type: ErrorType,
		private readonly payload: EtherpadParams,
		private readonly error?: Error
	) {
		super(type);
	}

	getLogMessage(): ErrorLogMessage {
		const { userId, parentId } = this.payload;

		const message: ErrorLogMessage = {
			type: this.type,
			stack: this.stack,
			error: this.error,
			data: {
				userId,
				parentId,
			},
		};

		return message;
	}
}
