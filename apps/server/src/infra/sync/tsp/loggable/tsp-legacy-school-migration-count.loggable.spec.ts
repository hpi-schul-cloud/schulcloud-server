import { faker } from '@faker-js/faker';
import { TspLegacySchoolMigrationCountLoggable } from './tsp-legacy-school-migration-count.loggable';

describe(TspLegacySchoolMigrationCountLoggable.name, () => {
	describe('getLogMessage is called', () => {
		const setup = () => {
			const total = faker.number.int();

			const expected = {
				message: `Found ${total} legacy tsp schools to migrate`,
				data: {
					total,
				},
			};

			return { total, expected };
		};

		it('should return a log message', () => {
			const { total, expected } = setup();

			const loggable = new TspLegacySchoolMigrationCountLoggable(total);

			expect(loggable.getLogMessage()).toEqual(expected);
		});
	});
});
