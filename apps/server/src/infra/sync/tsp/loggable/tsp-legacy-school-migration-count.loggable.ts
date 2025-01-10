import { Loggable, LogMessage } from '@src/core/logger';

export class TspLegacySchoolMigrationCountLoggable implements Loggable {
	constructor(private readonly total: number) {}

	public getLogMessage(): LogMessage {
		const message: LogMessage = {
			message: `Found ${this.total} legacy tsp schools to migrate`,
			data: {
				total: this.total,
			},
		};

		return message;
	}
}
