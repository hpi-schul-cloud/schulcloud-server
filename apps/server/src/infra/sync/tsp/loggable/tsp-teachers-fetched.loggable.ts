import { Loggable, LogMessage } from '@src/core/logger';

export class TspTeachersFetchedLoggable implements Loggable {
	constructor(private readonly tspUserMigrationCount: number) {}

	public getLogMessage(): LogMessage {
		const message: LogMessage = {
			message: `Fetched ${this.tspUserMigrationCount} users for migration from TSP`,
			data: {
				tspUserMigrationCount: this.tspUserMigrationCount,
			},
		};

		return message;
	}
}
