import { faker } from '@faker-js/faker';
import { TspUsersMigratedLoggable } from './tsp-users-migrated.loggable';

describe(TspUsersMigratedLoggable.name, () => {
	describe('getLogMessage is called', () => {
		const setup = () => {
			const totalMigrations = faker.number.int();
			const migratedUsers = faker.number.int();
			const migratedAccounts = faker.number.int();

			const expected = {
				message: `Migrated ${migratedUsers} users and ${migratedAccounts} accounts. Total amount of migrations requested: ${totalMigrations}`,
				data: {
					totalMigrations,
					migratedUsers,
					migratedAccounts,
				},
			};

			return { totalMigrations, migratedUsers, migratedAccounts, expected };
		};

		it('should return a log message', () => {
			const { totalMigrations, migratedUsers, migratedAccounts, expected } = setup();

			const loggable = new TspUsersMigratedLoggable(totalMigrations, migratedUsers, migratedAccounts);

			expect(loggable.getLogMessage()).toEqual(expected);
		});
	});
});
