import { InternalServerErrorException } from '@nestjs/common';
import { type ValidationError } from 'class-validator';
import { type Loggable, type LoggableMessage } from '../loggable/interfaces';

export class ValidationErrorLoggableException extends InternalServerErrorException implements Loggable {
	constructor(private readonly validationErrors: ValidationError[]) {
		super();
	}

	public getLogMessage(): LoggableMessage {
		const validationErrorListObject: { [key: number]: string } = this.validationErrors.reduce(
			(accumulator, currentValue, currentIndex) => {
				return {
					...accumulator,
					[currentIndex]: currentValue.toString(false, undefined, undefined, true),
				};
			},
			{}
		);

		const message: LoggableMessage = {
			type: 'VALIDATION_ERROR',
			stack: this.stack,
			data: {
				...validationErrorListObject,
			},
		};

		return message;
	}
}
