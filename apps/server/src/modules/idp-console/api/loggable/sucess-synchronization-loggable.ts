import { type Loggable, type LoggableMessage } from '@shared/common/loggable';

export class SucessSynchronizationLoggable implements Loggable {
	constructor(
		private readonly systemId: string,
		private readonly usersSynchronizedCount?: number
	) {}

	public getLogMessage(): LoggableMessage {
		return {
			message: 'Synchronization proccess end with success',
			data: {
				systemId: this.systemId,
				usersSynchronizedCount: this.usersSynchronizedCount,
			},
		};
	}
}
