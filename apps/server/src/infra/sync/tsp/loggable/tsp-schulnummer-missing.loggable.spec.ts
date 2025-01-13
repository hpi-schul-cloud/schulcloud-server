import { faker } from '@faker-js/faker';
import { TspSchulnummerMissingLoggable } from './tsp-schulnummer-missing.loggable';

describe(TspSchulnummerMissingLoggable.name, () => {
	describe('getLogMessage is called', () => {
		const setup = () => {
			const schulName = faker.company.name();

			const expected = {
				message: `The TSP school '${schulName}' is missing a Schulnummer. This school is skipped.`,
				data: {
					schulName,
				},
			};

			return { schulName, expected };
		};

		it('should return a log message', () => {
			const { schulName, expected } = setup();

			const loggable = new TspSchulnummerMissingLoggable(schulName);

			expect(loggable.getLogMessage()).toEqual(expected);
		});
	});
});
