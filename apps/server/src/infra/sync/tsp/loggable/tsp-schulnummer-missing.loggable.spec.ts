import { TspSchulnummerMissingLoggable } from './tsp-schulnummer-missing.loggable';

describe(TspSchulnummerMissingLoggable.name, () => {
	let loggable: TspSchulnummerMissingLoggable;

	beforeAll(() => {
		loggable = new TspSchulnummerMissingLoggable();
	});

	describe('when loggable is initialized', () => {
		it('should be defined', () => {
			expect(loggable).toBeDefined();
		});
	});

	describe('getLogMessage', () => {
		it('should return a log message', () => {
			expect(loggable.getLogMessage()).toEqual({
				message: `A TSP school is missing a Schulnummer. Skipping school.`,
			});
		});
	});
});
