import { LegacySchoolDo, UserLoginMigrationDO } from '@shared/domain/domainobject';
import { Loggable, LogMessage } from '@src/core/logger';

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
