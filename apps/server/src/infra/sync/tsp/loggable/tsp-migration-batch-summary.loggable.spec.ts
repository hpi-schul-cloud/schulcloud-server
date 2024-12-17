import { TspMigrationBatchSummaryLoggable } from './tsp-migration-batch-summary.loggable';

describe(TspMigrationBatchSummaryLoggable.name, () => {
	let loggable: TspMigrationBatchSummaryLoggable;

	beforeAll(() => {
		loggable = new TspMigrationBatchSummaryLoggable(1, 2, 3, 4, 5);
	});

	describe('when loggable is initialized', () => {
		it('should be defined', () => {
			expect(loggable).toBeDefined();
		});
	});

	describe('getLogMessage', () => {
		it('should return a log message', () => {
			expect(loggable.getLogMessage()).toEqual({
				message: `Migrated 2 users and 3 accounts in batch of size 1 (total done: 4, total migrations: 5)`,
				data: {
					batchSize: 1,
					usersUpdated: 2,
					accountsUpdated: 3,
					totalDone: 4,
					totalMigrations: 5,
				},
			});
		});
	});
});
