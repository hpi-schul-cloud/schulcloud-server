import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';

export class EmailAlreadyExistsLoggable implements Loggable {
	constructor(private readonly email: string, private readonly externalId?: string) {}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			message: 'The Email to be provisioned already exists.',
			data: {
				email: this.email,
				externalId: this.externalId,
			},
		};
	}
}
