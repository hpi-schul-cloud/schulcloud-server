import { HttpStatus } from '@nestjs/common';
import { BusinessError } from './business.error';

export class UnauthorizedError extends BusinessError {
	constructor(message: string, details?: Record<string, unknown>) {
		super(
			{
				type: 'UNAUTHORIZED',
				title: 'Unauthorized Error',
				defaultMessage: message,
			},
			HttpStatus.UNAUTHORIZED,
			details
		);
	}
}
