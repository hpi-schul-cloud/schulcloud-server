import { LegacySchoolDo } from '@shared/domain/domainobject';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';

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
