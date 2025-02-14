import { Loggable, LogMessage } from '@core/logger';

export class TspMigrationBatchSummaryLoggable implements Loggable {
	constructor(
		private readonly batchSize: number,
		private readonly usersUpdated: number,
		private readonly accountsUpdated: number,
		private readonly totalDone: number,
		private readonly totalMigrations: number
	) {}

	public getLogMessage(): LogMessage {
		const message: LogMessage = {
			message: `Migrated ${this.usersUpdated} users and ${this.accountsUpdated} accounts in batch of size ${this.batchSize} (total done: ${this.totalDone}, total migrations: ${this.totalMigrations})`,
			data: {
				batchSize: this.batchSize,
				usersUpdated: this.usersUpdated,
				accountsUpdated: this.accountsUpdated,
				totalDone: this.totalDone,
				totalMigrations: this.totalMigrations,
			},
		};

		return message;
	}
}
