import { TspLegacyMigrationStartLoggable } from './tsp-legacy-migration-start.loggable';

describe(TspLegacyMigrationStartLoggable.name, () => {
	describe('getLogMessage is called', () => {
		const setup = () => {
			const expected = {
				message: 'Running migration of legacy tsp data.',
			};

			return { expected };
		};

		it('should return a log message', () => {
			const { expected } = setup();

			const loggable = new TspLegacyMigrationStartLoggable();

			expect(loggable.getLogMessage()).toEqual(expected);
		});
	});
});
