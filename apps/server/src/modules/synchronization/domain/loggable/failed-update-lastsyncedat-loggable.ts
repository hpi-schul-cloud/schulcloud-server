import { LogMessage, Loggable } from '@src/core/logger';

export class FailedUpdateLastSyncedAtLoggable implements Loggable {
	constructor(private readonly systemId: string) {}

	getLogMessage(): LogMessage {
		return {
			message: 'Failed to update lastSyncedAt field for users provisioned by system',
			data: {
				systemId: this.systemId,
			},
		};
	}
}
