import { ErrorLogMessage, Loggable } from '@core/logger';
import { UnauthorizedException } from '@nestjs/common';

export class AuthenticationErrorLoggableException extends UnauthorizedException implements Loggable {
	constructor(
		private readonly error: unknown,
		private readonly userEmail: string
	) {
		super();
	}

	public getLogMessage(): ErrorLogMessage {
		const error = this.error instanceof Error ? this.error : new Error(JSON.stringify(this.error));
		const message: ErrorLogMessage = {
			type: AuthenticationErrorLoggableException.name,
			error,
			stack: this.stack,
			data: {
				email: this.maskEmail(this.userEmail),
				message: 'Authentication failed for the provided credentials',
			},
		};

		return message;
	}

	private maskEmail(email: string): string {
		const atIndex = email.indexOf('@');

		if (atIndex <= 3) {
			return `${email.slice(0, 3)}***`;
		}

		const localPart = email.slice(0, atIndex);
		const domainPart = email.slice(atIndex);
		const visibleLocalPart = localPart.slice(0, 3);
		const maskedRemainder = localPart.length > 3 ? '*'.repeat(localPart.length - 3) : '';

		return `${visibleLocalPart}${maskedRemainder}${domainPart}`;
	}
}
