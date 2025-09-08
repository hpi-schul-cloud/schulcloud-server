import { faker } from '@faker-js/faker';
import { TspSchoolsFetchedLoggable } from './tsp-schools-fetched.loggable';

describe(TspSchoolsFetchedLoggable.name, () => {
	describe('getLogMessage is called and daysFetched is greater than 0', () => {
		const setup = () => {
			const tspSchoolCount = faker.number.int();
			const daysFetched = faker.number.int(1);

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

	describe('getLogMessage is called and daysFetched is -1', () => {
		const setup = () => {
			const tspSchoolCount = faker.number.int();
			const daysFetched = -1;

			const expected = {
				message: `Fetched ${tspSchoolCount} schools for full sync from TSP`,
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
