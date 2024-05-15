import { ObjectId } from '@mikro-orm/mongodb';
import { legacySchoolDoFactory, userLoginMigrationDOFactory } from '@shared/testing/factory';
import { SchoolMigrationSuccessfulLoggable } from './school-migration-successful.loggable';

describe(SchoolMigrationSuccessfulLoggable.name, () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const school = legacySchoolDoFactory.build({
				id: new ObjectId().toHexString(),
				externalId: 'externalId',
				previousExternalId: 'previousExternalId',
			});
			const userLoginMigration = userLoginMigrationDOFactory.build({
				id: new ObjectId().toHexString(),
			});

			const exception = new SchoolMigrationSuccessfulLoggable(school, userLoginMigration);

			return {
				exception,
				school,
				userLoginMigration,
			};
		};

		it('should return the correct log message', () => {
			const { exception, school, userLoginMigration } = setup();

			const message = exception.getLogMessage();

			expect(message).toEqual({
				message: 'A school has successfully migrated.',
				data: {
					schoolId: school.id,
					externalId: school.externalId,
					previousExternalId: school.previousExternalId,
					userLoginMigrationId: userLoginMigration.id,
				},
			});
		});
	});
});
