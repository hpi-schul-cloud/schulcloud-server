import { HttpStatus } from '@nestjs/common';
import { BusinessError } from './business.error';

export class InvalidArgumentError extends BusinessError {
	constructor(message: string, details?: Record<string, unknown>) {
		super(
			{
				type: 'INVALID_ARGUMENT',
				title: 'Invalid Argument Error',
				defaultMessage: message,
			},
			HttpStatus.BAD_REQUEST,
			details
		);
	}
}
