import { TspUsersMigratedLoggable } from './tsp-users-migrated.loggable';

describe(TspUsersMigratedLoggable.name, () => {
	let loggable: TspUsersMigratedLoggable;

	beforeAll(() => {
		loggable = new TspUsersMigratedLoggable(10, 5, 4);
	});

	describe('when loggable is initialized', () => {
		it('should be defined', () => {
			expect(loggable).toBeDefined();
		});
	});

	describe('getLogMessage', () => {
		it('should return a log message', () => {
			expect(loggable.getLogMessage()).toEqual({
				message: `Migrated 5 users and 4 accounts. Total amount of migrations requested: 10`,
				data: {
					totalMigrations: 10,
					migratedUsers: 5,
					migratedAccounts: 4,
				},
			});
		});
	});
});
