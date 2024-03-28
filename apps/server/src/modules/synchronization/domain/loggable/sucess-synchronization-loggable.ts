import { LogMessage, Loggable } from '@src/core/logger';

export class SucessSynchronizationLoggable implements Loggable {
	constructor(private readonly systemId: string, private readonly usersSynchronizedCount?: number) {}

	getLogMessage(): LogMessage {
		return {
			message: 'Synchronization proccess end with success',
			data: {
				systemId: this.systemId,
				usersSynchronizedCount: this.usersSynchronizedCount,
			},
		};
	}
}
