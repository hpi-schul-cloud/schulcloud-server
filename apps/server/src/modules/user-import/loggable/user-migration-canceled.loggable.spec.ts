import { legacySchoolDoFactory } from '@shared/testing';
import { UserMigrationCanceledLoggable } from './user-migration-canceled.loggable';

describe('UserMigrationCanceledLoggable', () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const school = legacySchoolDoFactory.buildWithId({ name: 'Schoolname' });
			const loggable = new UserMigrationCanceledLoggable(school);

			return {
				loggable,
				school,
			};
		};

		it('should return the correct log message', () => {
			const { loggable, school } = setup();

			const message = loggable.getLogMessage();

			expect(message).toEqual({
				message: 'The user migration was canceled.',
				data: {
					schoolName: school.name,
					schoolId: school.id,
				},
			});
		});
	});
});
