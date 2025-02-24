import { Loggable, LogMessage } from '@core/logger';

export class TspSyncingUsersLoggable implements Loggable {
	constructor(private readonly syncingUsers: number) {}

	public getLogMessage(): LogMessage {
		const message: LogMessage = {
			message: `Syncing ${this.syncingUsers} users from TSP.`,
			data: {
				syncingUsers: this.syncingUsers,
			},
		};

		return message;
	}
}
