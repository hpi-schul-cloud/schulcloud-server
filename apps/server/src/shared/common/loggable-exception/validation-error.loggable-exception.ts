import { InternalServerErrorException } from '@nestjs/common';
import { Loggable } from '@src/core/logger/interfaces';
import { ErrorLogMessage } from '@src/core/logger/types';
import { ValidationError } from 'class-validator';

export class ValidationErrorLoggableException extends InternalServerErrorException implements Loggable {
	constructor(private readonly validationErrors: ValidationError[]) {
		super();
	}

	getLogMessage(): ErrorLogMessage {
		const validationErrorListObject: { [key: number]: string } = this.validationErrors.reduce(
			(accumulator, currentValue, currentIndex) => {
				return {
					...accumulator,
					[currentIndex]: currentValue.toString(false, undefined, undefined, true),
				};
			},
			{}
		);

		const message: ErrorLogMessage = {
			type: 'VALIDATION_ERROR',
			stack: this.stack,
			data: {
				...validationErrorListObject,
			},
		};

		return message;
	}
}
