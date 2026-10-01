import { type Loggable, type LoggableMessage } from '@shared/common/loggable';

export class LicenseMediaSourceMissingLoggable implements Loggable {
	constructor(private readonly mediumId: string) {}

	public getLogMessage(): LoggableMessage {
		return {
			message: 'Could not determine the media source for a Schulconnex license.',
			data: {
				mediumId: this.mediumId,
			},
		};
	}
}
