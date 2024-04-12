import { LogMessage, Loggable } from '@src/core/logger';

export class StartSynchronizationLoggable implements Loggable {
	constructor(private readonly systemId: string) {}

	getLogMessage(): LogMessage {
		return {
			message: 'Start synchronization users from systemId',
			data: {
				systemId: this.systemId,
			},
		};
	}
}
