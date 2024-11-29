import { Loggable, LogMessage } from '../../../../core/logger';

export class TspStudentsMigratedLoggable implements Loggable {
	constructor(private readonly migratedStudents: number) {}

	public getLogMessage(): LogMessage {
		const message: LogMessage = {
			message: `Migrated students: ${this.migratedStudents} students migrated`,
			data: {
				migratedStudents: this.migratedStudents,
			},
		};

		return message;
	}
}
