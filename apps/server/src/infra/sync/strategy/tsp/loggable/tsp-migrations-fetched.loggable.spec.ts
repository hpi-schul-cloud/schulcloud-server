import { faker } from '@faker-js/faker';
import { TspMigrationsFetchedLoggable } from './tsp-migrations-fetched.loggable';

describe(TspMigrationsFetchedLoggable.name, () => {
	describe('getLogMessage is called', () => {
		const setup = () => {
			const tspUserMigrationCount = faker.number.int();

			const expected = {
				message: `Fetched ${tspUserMigrationCount} users for migration from TSP`,
				data: {
					tspUserMigrationCount,
				},
			};

			return { tspUserMigrationCount, expected };
		};

		it('should return a log message', () => {
			const { tspUserMigrationCount, expected } = setup();

			const loggable = new TspMigrationsFetchedLoggable(tspUserMigrationCount);

			expect(loggable.getLogMessage()).toEqual(expected);
		});
	});
});
