import { type Loggable, type LoggableMessage } from '@shared/common/loggable';

export class StartSynchronizationLoggable implements Loggable {
	constructor(private readonly systemId: string) {}

	public getLogMessage(): LoggableMessage {
		return {
			message: 'Start synchronization users from systemId',
			data: {
				systemId: this.systemId,
			},
		};
	}
}
