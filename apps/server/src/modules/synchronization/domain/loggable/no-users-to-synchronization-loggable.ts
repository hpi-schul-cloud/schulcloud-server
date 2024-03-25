import { LogMessage, Loggable } from '@src/core/logger';

export class NoUsersToSynchronizationLoggable implements Loggable {
	constructor(private readonly systemId: string) {}

	getLogMessage(): LogMessage {
		return {
			message: 'No users to check from system',
			data: {
				systemId: this.systemId,
			},
		};
	}
}
