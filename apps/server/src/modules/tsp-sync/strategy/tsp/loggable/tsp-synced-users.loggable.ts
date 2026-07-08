import { Loggable, LoggableMessage } from '@shared/common/loggable';

export class TspSyncedUsersLoggable implements Loggable {
	constructor(private readonly syncedUsers: number) {}

	public getLogMessage(): LoggableMessage {
		const message: LoggableMessage = {
			message: `Synced ${this.syncedUsers} users from TSP.`,
			data: {
				syncedUsers: this.syncedUsers,
			},
		};

		return message;
	}
}
