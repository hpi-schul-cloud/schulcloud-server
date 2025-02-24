import { TspLegacyMigrationSystemMissingLoggable } from './tsp-legacy-migration-system-missing.loggable';

describe(TspLegacyMigrationSystemMissingLoggable.name, () => {
	describe('getLogMessage is called', () => {
		const setup = () => {
			const expected = {
				message: 'No legacy system found',
			};

			return { expected };
		};

		it('should return a log message', () => {
			const { expected } = setup();

			const loggable = new TspLegacyMigrationSystemMissingLoggable();

			expect(loggable.getLogMessage()).toEqual(expected);
		});
	});
});
