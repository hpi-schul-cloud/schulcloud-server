import { faker } from '@faker-js/faker';
import { TspSchoolsFetchedLoggable } from './tsp-schools-fetched.loggable';

describe(TspSchoolsFetchedLoggable.name, () => {
	describe('getLogMessage is called', () => {
		const setup = () => {
			const tspSchoolCount = faker.number.int();
			const daysFetched = faker.number.int();

			const expected = {
				message: `Fetched ${tspSchoolCount} schools for the last ${daysFetched} days from TSP`,
				data: {
					tspSchoolCount,
					daysFetched,
				},
			};

			return { tspSchoolCount, daysFetched, expected };
		};

		it('should return a log message', () => {
			const { tspSchoolCount, daysFetched, expected } = setup();

			const loggable = new TspSchoolsFetchedLoggable(tspSchoolCount, daysFetched);

			expect(loggable.getLogMessage()).toEqual(expected);
		});
	});
});
