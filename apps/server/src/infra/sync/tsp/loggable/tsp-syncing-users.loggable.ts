import { Loggable, LogMessage } from '@src/core/logger';

export class TspSyncingUsersLoggable implements Loggable {
	constructor(private readonly syncingUsers: number) {}

	getLogMessage(): LogMessage {
		const message: LogMessage = {
			message: `Syncing ${this.syncingUsers} users from TSP.`,
			data: {
				syncingUsers: this.syncingUsers,
			},
		};

		return message;
	}
}
