import { Loggable, LogMessage } from '../../../../core/logger';

export class TspTeachersMigratedLoggable implements Loggable {
	constructor(private readonly migratedTeachers: number) {}

	public getLogMessage(): LogMessage {
		const message: LogMessage = {
			message: `Migrated teachers: ${this.migratedTeachers} teachers migrated`,
			data: {
				migratedTeachers: this.migratedTeachers,
			},
		};

		return message;
	}
}
