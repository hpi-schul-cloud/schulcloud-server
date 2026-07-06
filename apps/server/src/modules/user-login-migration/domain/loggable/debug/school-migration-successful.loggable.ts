import { LegacySchoolDo } from '@modules/legacy-school/domain';
import { Loggable, LoggableMessage } from '@shared/common/loggable';
import { UserLoginMigrationDO } from '../../do';

export class SchoolMigrationSuccessfulLoggable implements Loggable {
	constructor(
		private readonly school: LegacySchoolDo,
		private readonly userLoginMigration: UserLoginMigrationDO
	) {}

	getLogMessage(): LoggableMessage {
		return {
			message: 'A school has successfully migrated.',
			data: {
				schoolId: this.school.id,
				externalId: this.school.externalId,
				previousExternalId: this.school.previousExternalId,
				userLoginMigrationId: this.userLoginMigration.id,
			},
		};
	}
}
