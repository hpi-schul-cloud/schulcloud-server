import { TspSchulnummerMissingLoggable } from './tsp-schulnummer-missing.loggable';

describe(TspSchulnummerMissingLoggable.name, () => {
	let loggable: TspSchulnummerMissingLoggable;

	beforeAll(() => {
		loggable = new TspSchulnummerMissingLoggable('Schule');
	});

	describe('when loggable is initialized', () => {
		it('should be defined', () => {
			expect(loggable).toBeDefined();
		});
	});

	describe('getLogMessage', () => {
		it('should return a log message', () => {
			expect(loggable.getLogMessage()).toEqual({
				message: `The TSP school 'Schule' is missing a Schulnummer. This school is skipped.`,
				data: {
					schulName: 'Schule',
				},
			});
		});
	});
});
