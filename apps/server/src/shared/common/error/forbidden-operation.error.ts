import { HttpStatus } from '@nestjs/common';
import { BusinessError } from './business.error';

export class ForbiddenOperationError extends BusinessError {
	constructor(message?: string, details?: Record<string, unknown>) {
		super(
			{
				type: 'FORBIDDEN_OPERATION',
				title: 'Forbidden Operation Error',
				defaultMessage: message ?? 'A forbidden operation error occurred.',
			},
			HttpStatus.FORBIDDEN,
			details
		);
	}
}
