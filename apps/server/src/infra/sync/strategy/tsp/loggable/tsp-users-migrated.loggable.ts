import { Loggable, LogMessage } from '@src/core/logger';

export class TspUsersMigratedLoggable implements Loggable {
	constructor(
		private readonly totalMigrations: number,
		private readonly migratedUsers: number,
		private readonly migratedAccounts: number
	) {}

	public getLogMessage(): LogMessage {
		const message: LogMessage = {
			message: `Migrated ${this.migratedUsers} users and ${this.migratedAccounts} accounts. Total amount of migrations requested: ${this.totalMigrations}`,
			data: {
				totalMigrations: this.totalMigrations,
				migratedUsers: this.migratedUsers,
				migratedAccounts: this.migratedAccounts,
			},
		};

		return message;
	}
}
