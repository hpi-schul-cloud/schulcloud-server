import { Loggable, LoggableMessage } from '@shared/common/loggable';

export class TspSyncingUsersLoggable implements Loggable {
	constructor(private readonly syncingUsers: number) {}

	public getLogMessage(): LoggableMessage {
		const message: LoggableMessage = {
			message: `Syncing ${this.syncingUsers} users from TSP.`,
			data: {
				syncingUsers: this.syncingUsers,
			},
		};

		return message;
	}
}
