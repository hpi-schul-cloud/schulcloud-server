import { HttpStatus } from '@nestjs/common';
import { BusinessError } from '@shared/common';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';

export class OauthConfigMissingLoggableException extends BusinessError implements Loggable {
	constructor(private readonly systemId: string) {
		super(
			{
				type: 'OAUTH_CONFIG_MISSING',
				title: 'Oauth config missing',
				defaultMessage: 'Requested system has no oauth configured',
			},
			HttpStatus.INTERNAL_SERVER_ERROR
		);
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: this.type,
			message: this.message,
			stack: this.stack,
			data: {
				systemId: this.systemId,
			},
		};
	}
}
