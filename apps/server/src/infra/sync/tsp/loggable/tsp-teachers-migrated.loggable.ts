import { Loggable, LogMessage } from '@src/core/logger';

export class TspTeachersMigratedLoggable implements Loggable {
	constructor(private readonly migratedTeachers: number) {}

	getLogMessage(): LogMessage {
		const message: LogMessage = {
			message: `Migrated teachers: ${this.migratedTeachers} teachers migrated`,
			data: {
				migratedTeachers: this.migratedTeachers,
			},
		};

		return message;
	}
}
