import { type Loggable, type LoggableMessage } from '@shared/common/loggable';

export class TspSyncDisabledLoggable implements Loggable {
	constructor(private readonly reason: string) {}

	// istanbul ignore next
	public getLogMessage(): LoggableMessage {
		return {
			message: `TSP Sync is disabled: ${this.reason}`,
		};
	}
}
