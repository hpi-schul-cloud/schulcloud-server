import { type Loggable, type LoggableMessage } from '@shared/common/loggable';

type Stats = {
	chunkIndex: number;
	externalUserIdCount?: number;
	userWithOneExternalIdCount?: number;
	usersWithAccountAndSystem?: number;
};

export class ProgressSynchronizationLoggable implements Loggable {
	constructor(private readonly stats: Stats) {}

	public getLogMessage(): LoggableMessage {
		const { chunkIndex, externalUserIdCount, userWithOneExternalIdCount, usersWithAccountAndSystem } = this.stats;
		const message: LoggableMessage = {
			message: `chunk ${chunkIndex}: synchronization package ${externalUserIdCount ?? 0} external user ids / ${
				userWithOneExternalIdCount ?? 0
			} users found / ${usersWithAccountAndSystem ?? 0} with account and correct system`,
			data: this.stats,
		};

		return message;
	}
}
