import { Loggable, LogMessage } from '@infra/logger';

export class TspSyncDisabledLoggable implements Loggable {
	constructor(private readonly reason: string) {}

	// istanbul ignore next
	public getLogMessage(): LogMessage {
		return {
			message: `TSP Sync is disabled: ${this.reason}`,
		};
	}
}
