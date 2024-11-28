import { TspLegacyMigrationStartLoggable } from './tsp-legacy-migration-start.loggable';

describe(TspLegacyMigrationStartLoggable.name, () => {
	let loggable: TspLegacyMigrationStartLoggable;

	beforeAll(() => {
		loggable = new TspLegacyMigrationStartLoggable();
	});

	describe('when loggable is initialized', () => {
		it('should be defined', () => {
			expect(loggable).toBeDefined();
		});
	});

	describe('getLogMessage', () => {
		it('should return a log message', () => {
			expect(loggable.getLogMessage()).toEqual({
				message: 'Running migration of legacy tsp data.',
			});
		});
	});
});
