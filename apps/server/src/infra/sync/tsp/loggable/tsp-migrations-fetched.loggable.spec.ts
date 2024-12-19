import { TspMigrationsFetchedLoggable } from './tsp-migrations-fetched.loggable';

describe(TspMigrationsFetchedLoggable.name, () => {
	let loggable: TspMigrationsFetchedLoggable;

	beforeAll(() => {
		loggable = new TspMigrationsFetchedLoggable(10);
	});

	describe('when loggable is initialized', () => {
		it('should be defined', () => {
			expect(loggable).toBeDefined();
		});
	});

	describe('getLogMessage', () => {
		it('should return a log message', () => {
			expect(loggable.getLogMessage()).toEqual({
				message: `Fetched 10 users for migration from TSP`,
				data: {
					tspUserMigrationCount: 10,
				},
			});
		});
	});
});
