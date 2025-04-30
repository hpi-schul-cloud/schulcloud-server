import { Loggable } from '@core/logger/interfaces';
import { LogMessage } from '@core/logger/types';
import { SentinalHost } from '../types';

export class DiscoveredSentinalHostsLoggable implements Loggable {
	constructor(private readonly data: SentinalHost[]) {}

	public getLogMessage(): LogMessage {
		const log = {
			message: 'Discovered sentinels:',
			data: JSON.stringify(this.data),
		};

		return log;
	}
}
