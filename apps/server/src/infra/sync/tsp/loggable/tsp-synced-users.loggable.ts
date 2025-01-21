import { Loggable, LogMessage } from '@core/logger';

export class TspSyncedUsersLoggable implements Loggable {
	constructor(private readonly syncedUsers: number) {}

	public getLogMessage(): LogMessage {
		const message: LogMessage = {
			message: `Synced ${this.syncedUsers} users from TSP.`,
			data: {
				syncedUsers: this.syncedUsers,
			},
		};

		return message;
	}
}
