import { Loggable, LogMessage } from '@core/logger';

export class TspSyncDisabledLoggable implements Loggable {
	public constructor(private readonly reason: string) {}

	public getLogMessage(): LogMessage {
		return {
			message: `TSP Sync is disabled: ${this.reason}`,
		};
	}
}
