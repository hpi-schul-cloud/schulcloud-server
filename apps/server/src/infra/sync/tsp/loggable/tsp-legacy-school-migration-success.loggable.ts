import { Loggable, LogMessage } from '../../../../core/logger';

export class TspLegacySchoolMigrationSuccessLoggable implements Loggable {
	constructor(private readonly total: number, private readonly migrated: number) {}

	getLogMessage(): LogMessage {
		const message: LogMessage = {
			message: `Legacy tsp data migration finished. Total schools: ${this.total}, migrated schools: ${this.migrated}`,
			data: {
				total: this.total,
				migrated: this.migrated,
			},
		};

		return message;
	}
}
