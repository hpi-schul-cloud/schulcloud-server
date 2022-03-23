import { HttpStatus } from '@nestjs/common';
import { BusinessError } from './business.error';

export class InvalidOperationError extends BusinessError {
	constructor(message?: string, details?: Record<string, unknown>) {
		super(
			{
				type: 'INVALID_OPERATION',
				title: 'Invalid Operation Error',
				defaultMessage: message ?? 'An invalid operation error occurred.',
			},
			HttpStatus.FORBIDDEN,
			details
		);
	}
}
