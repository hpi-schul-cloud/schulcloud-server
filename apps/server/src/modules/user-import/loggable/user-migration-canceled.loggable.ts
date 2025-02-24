import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@core/logger';
import { LegacySchoolDo } from '@modules/legacy-school/domain';

export class UserMigrationCanceledLoggable implements Loggable {
	constructor(private readonly school: LegacySchoolDo) {}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			message: 'The user migration was canceled.',
			data: {
				schoolName: this.school.name,
				schoolId: this.school.id,
			},
		};
	}
}
