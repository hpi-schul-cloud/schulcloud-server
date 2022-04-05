import { HttpStatus } from '@nestjs/common';
import { BusinessError } from './business.error';

export class AuthorizationError extends BusinessError {
	constructor(message?: string, details?: Record<string, unknown>) {
		super(
			{
				type: 'AUTHORIZATION_OPERATION',
				title: 'Authorization Error',
				defaultMessage: message ?? 'The action could not be authorized.',
			},
			HttpStatus.UNAUTHORIZED,
			details
		);
	}
}
