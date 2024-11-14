import { TspLegacyMigrationCountLoggable } from './tsp-legacy-migration-count.loggable';

describe(TspLegacyMigrationCountLoggable.name, () => {
	let loggable: TspLegacyMigrationCountLoggable;

	beforeAll(() => {
		loggable = new TspLegacyMigrationCountLoggable(10);
	});

	describe('when loggable is initialized', () => {
		it('should be defined', () => {
			expect(loggable).toBeDefined();
		});
	});

	describe('getLogMessage', () => {
		it('should return a log message', () => {
			expect(loggable.getLogMessage()).toEqual({
				message: `Found 10 legacy tsp schools to migrate`,
				data: {
					total: 10,
				},
			});
		});
	});
});
