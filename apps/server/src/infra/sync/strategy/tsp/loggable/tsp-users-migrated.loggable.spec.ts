import { TspUsersMigratedLoggable } from './tsp-users-migrated.loggable';

describe(TspUsersMigratedLoggable.name, () => {
	let loggable: TspUsersMigratedLoggable;

	beforeAll(() => {
		loggable = new TspUsersMigratedLoggable(10);
	});

	describe('when loggable is initialized', () => {
		it('should be defined', () => {
			expect(loggable).toBeDefined();
		});
	});

	describe('getLogMessage', () => {
		it('should return a log message', () => {
			expect(loggable.getLogMessage()).toEqual({
				message: `Migrated users: 10 users migrated`,
				data: {
					migratedUsers: 10,
				},
			});
		});
	});
});
