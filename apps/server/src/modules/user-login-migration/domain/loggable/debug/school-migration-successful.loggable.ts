import { Loggable, LogMessage } from '@core/logger';
import { LegacySchoolDo } from '@modules/legacy-school/domain';
import { UserLoginMigrationDO } from '../../do';

export class SchoolMigrationSuccessfulLoggable implements Loggable {
	constructor(private readonly school: LegacySchoolDo, private readonly userLoginMigration: UserLoginMigrationDO) {}

	getLogMessage(): LogMessage {
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
