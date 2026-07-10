import { type Loggable, type LoggableMessage } from '@shared/common/loggable';

export class ResendingRegistrationMailLoggable implements Loggable {
	constructor(private readonly registrationId: string) {}

	/* istanbul ignore next */
	public getLogMessage(): LoggableMessage {
		const message = {
			message: `Resending registration mail failed for`,
			data: { registrationId: this.registrationId },
		};

		return message;
	}
}
