import { faker } from '@faker-js/faker';
import { TspSchulnummerMissingLoggable } from './tsp-schulnummer-missing.loggable';
import { robjExportSchuleFactory } from '@infra/tsp-client/testing';

describe(TspSchulnummerMissingLoggable.name, () => {
	describe('getLogMessage is called', () => {
		const setup = () => {
			const tspSchool = robjExportSchuleFactory.build({
				schuleNummer: undefined,
				schuleName: faker.company.name(),
			});

			const expected = {
				message: `The following TSP schools are missing a Schulnummer and are skipped.`,
				data: {
					schulNames: tspSchool.schuleName,
				},
			};

			return { tspSchool, expected };
		};

		it('should return a log message', () => {
			const { tspSchool, expected } = setup();

			const loggable = new TspSchulnummerMissingLoggable([tspSchool]);

			expect(loggable.getLogMessage()).toEqual(expected);
		});
	});
});
