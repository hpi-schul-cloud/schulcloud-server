import { Loggable, LogMessage } from '@infra/logger';
import { SentinalHost } from '../types';

export class DiscoveredSentinalHostsLoggable implements Loggable {
	constructor(private readonly data: SentinalHost[]) {}

	// istanbul ignore next
	public getLogMessage(): LogMessage {
		const log = {
			message: 'Discovered sentinels:',
			data: JSON.stringify(this.data),
		};

		return log;
	}
}
