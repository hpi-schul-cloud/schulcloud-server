import { type HttpExceptionOptions, InternalServerErrorException } from '@nestjs/common';
import { type ErrorLogMessage } from '@shared/common/error';
import { type Loggable } from '@shared/common/loggable';
import { type EtherpadErrorType, type EtherpadParams } from '../interface';

export class EtherpadErrorLoggableException extends InternalServerErrorException implements Loggable {
	constructor(
		private readonly type: EtherpadErrorType,
		private readonly payload: EtherpadParams,
		private readonly originalMessage: string | undefined,
		private readonly exceptionOptions: HttpExceptionOptions
	) {
		super(type, exceptionOptions);
	}

	getLogMessage(): ErrorLogMessage {
		const { userId, parentId } = this.payload;

		const message: ErrorLogMessage = {
			type: this.type,
			stack: this.stack,
			data: {
				userId,
				parentId,
				originalMessage: this.originalMessage,
			},
		};

		return message;
	}
}
