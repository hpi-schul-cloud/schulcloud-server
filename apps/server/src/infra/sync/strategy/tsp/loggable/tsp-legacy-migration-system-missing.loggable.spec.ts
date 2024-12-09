import { TspLegacyMigrationSystemMissingLoggable } from './tsp-legacy-migration-system-missing.loggable';

describe(TspLegacyMigrationSystemMissingLoggable.name, () => {
	let loggable: TspLegacyMigrationSystemMissingLoggable;

	beforeAll(() => {
		loggable = new TspLegacyMigrationSystemMissingLoggable();
	});

	describe('when loggable is initialized', () => {
		it('should be defined', () => {
			expect(loggable).toBeDefined();
		});
	});

	describe('getLogMessage', () => {
		it('should return a log message', () => {
			expect(loggable.getLogMessage()).toEqual({
				message: 'No legacy system found',
			});
		});
	});
});
