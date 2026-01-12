import { Loggable, LogMessage } from '@core/logger';

export class ResendingRegistrationMailLoggable implements Loggable {
	constructor(private readonly registrationId: string) {}

	/* istanbul ignore next */
	public getLogMessage(): LogMessage {
		const message = {
			message: `Resending registration mail failed for`,
			data: { registrationId: this.registrationId },
		};

		return message;
	}
}
