import { LegacySchoolDo } from '@modules/legacy-school/domain';
import { Loggable, LoggableMessage } from '@shared/common/loggable';

export class UserMigrationCanceledLoggable implements Loggable {
	constructor(private readonly school: LegacySchoolDo) {}

	getLogMessage(): LoggableMessage {
		return {
			message: 'The user migration was canceled.',
			data: {
				schoolName: this.school.name,
				schoolId: this.school.id,
			},
		};
	}
}
