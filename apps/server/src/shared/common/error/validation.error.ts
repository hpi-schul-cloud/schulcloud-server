import { HttpStatus } from '@nestjs/common';
import { BusinessError } from './business.error';

export class ValidationError extends BusinessError {
	constructor(readonly message: string, details?: Record<string, unknown>) {
		super(
			{
				type: 'VALIDATION_ERROR',
				title: 'Validation Error',
				defaultMessage: message,
			},
			HttpStatus.BAD_REQUEST,
			details
		);
	}
}
