import { faker } from '@faker-js/faker';
import { TspMigrationBatchSummaryLoggable } from './tsp-migration-batch-summary.loggable';

describe(TspMigrationBatchSummaryLoggable.name, () => {
	describe('getLogMessage is called', () => {
		const setup = () => {
			const batchSize = faker.number.int();
			const usersUpdated = faker.number.int();
			const accountsUpdated = faker.number.int();
			const totalDone = faker.number.int();
			const totalMigrations = faker.number.int();

			const expected = {
				message: `Migrated ${usersUpdated} users and ${accountsUpdated} accounts in batch of size ${batchSize} (total done: ${totalDone}, total migrations: ${totalMigrations})`,
				data: {
					batchSize,
					usersUpdated,
					accountsUpdated,
					totalDone,
					totalMigrations,
				},
			};

			return {
				batchSize,
				usersUpdated,
				accountsUpdated,
				totalDone,
				totalMigrations,
				expected,
			};
		};

		it('should return a log message', () => {
			const { batchSize, usersUpdated, accountsUpdated, totalDone, totalMigrations, expected } = setup();

			const loggable = new TspMigrationBatchSummaryLoggable(
				batchSize,
				usersUpdated,
				accountsUpdated,
				totalDone,
				totalMigrations
			);

			expect(loggable.getLogMessage()).toEqual(expected);
		});
	});
});
