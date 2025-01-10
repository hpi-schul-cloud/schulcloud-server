import { faker } from '@faker-js/faker';
import { TspLegacySchoolMigrationSuccessLoggable } from './tsp-legacy-school-migration-success.loggable';

describe(TspLegacySchoolMigrationSuccessLoggable.name, () => {
	describe('getLogMessage is called', () => {
		const setup = () => {
			const total = faker.number.int();
			const migrated = faker.number.int();

			const expected = {
				message: `Legacy tsp data migration finished. Total schools: ${total}, migrated schools: ${migrated}`,
				data: {
					total,
					migrated,
				},
			};

			return { total, migrated, expected };
		};

		it('should return a log message', () => {
			const { total, migrated, expected } = setup();

			const loggable = new TspLegacySchoolMigrationSuccessLoggable(total, migrated);

			expect(loggable.getLogMessage()).toEqual(expected);
		});
	});
});
