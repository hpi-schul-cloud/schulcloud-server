import { type LegacySchoolDo } from '@modules/legacy-school/domain';
import { type Loggable, type LoggableMessage } from '@shared/common/loggable';

export class UserMigrationCanceledLoggable implements Loggable {
	constructor(private readonly school: LegacySchoolDo) {}

	public getLogMessage(): LoggableMessage {
		return {
			message: 'The user migration was canceled.',
			data: {
				schoolName: this.school.name,
				schoolId: this.school.id,
			},
		};
	}
}
