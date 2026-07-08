import { type Loggable, type LoggableMessage } from '@shared/common/loggable';
import { type SentinalHost } from '../types';

export class DiscoveredSentinalHostsLoggable implements Loggable {
	constructor(private readonly data: SentinalHost[]) {}

	// istanbul ignore next
	public getLogMessage(): LoggableMessage {
		const log = {
			message: 'Discovered sentinels:',
			data: JSON.stringify(this.data),
		};

		return log;
	}
}
