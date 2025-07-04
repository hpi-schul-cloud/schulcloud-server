import { Loggable, LogMessage } from '@core/logger';

type Stats = {
	chunkIndex: number;
	externalUserIdCount?: number;
	userWithOneExternalIdCount?: number;
	usersWithAccountAndSystem?: number;
};

export class ProgressSynchronizationLoggable implements Loggable {
	constructor(private readonly stats: Stats) {}

	public getLogMessage(): LogMessage {
		const { chunkIndex, externalUserIdCount, userWithOneExternalIdCount, usersWithAccountAndSystem } = this.stats;
		const message: LogMessage = {
			message: `chunk ${chunkIndex}: synchronization package ${externalUserIdCount ?? 0} external user ids / ${
				userWithOneExternalIdCount ?? 0
			} users found / ${usersWithAccountAndSystem ?? 0} with account and correct system`,
			data: this.stats,
		};

		return message;
	}
}
