import { HttpStatus } from '@nestjs/common';
import { BusinessError } from '@shared/common';
import { Loggable } from '@src/core/logger/interfaces';
import { ErrorLogMessage, LogMessage, ValidationErrorLogMessage } from '@src/core/logger/types';

export class TooManyPseudonymsLoggableException extends BusinessError implements Loggable {
	constructor(private readonly pseudonym: string) {
		super(
			{
				type: 'PSEUDONYMS_TOO_MANY_PSEUDONYMS_FOUND',
				title: 'Too many pseudonyms where found.',
				defaultMessage: 'Too many pseudonyms where found.',
			},
			HttpStatus.BAD_REQUEST
		);
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: 'PSEUDONYMS_TOO_MANY_PSEUDONYMS_FOUND',
			message: 'Too many pseudonyms where found.',
			stack: this.stack,
			data: {
				pseudonym: this.pseudonym,
			},
		};
	}
}
