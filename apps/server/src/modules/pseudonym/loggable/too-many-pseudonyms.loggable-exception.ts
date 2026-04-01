import { Loggable } from '@core/logger/interfaces';
import { ErrorLogMessage, LogMessage, ValidationErrorLogMessage } from '@core/logger/types';
import { HttpStatus } from '@nestjs/common';
import { BusinessError } from '@shared/common/error';

export class TooManyPseudonymsLoggableException extends BusinessError implements Loggable {
	constructor(private readonly pseudonym: string) {
		super(
			{
				type: 'PSEUDONYMS_TOO_MANY_PSEUDONYMS_FOUND',
				title: 'Too many pseudonyms were found.',
				defaultMessage: 'Too many pseudonyms were found.',
			},
			HttpStatus.BAD_REQUEST
		);
	}

	public getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: 'PSEUDONYMS_TOO_MANY_PSEUDONYMS_FOUND',
			message: 'Too many pseudonyms were found.',
			stack: this.stack,
			data: {
				pseudonym: this.pseudonym,
			},
		};
	}
}
