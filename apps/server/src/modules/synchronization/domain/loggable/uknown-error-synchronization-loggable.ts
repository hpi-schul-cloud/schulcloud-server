import { LogMessage, Loggable } from '@src/core/logger';

export class UnknowErrorSynchronizationLoggable implements Loggable {
	constructor(private readonly systemId: string) {}

	getLogMessage(): LogMessage {
		return {
			message: 'Unknonw error during synchronisation process for users provisioned by system',
			data: {
				systemId: this.systemId,
			},
		};
	}
}
