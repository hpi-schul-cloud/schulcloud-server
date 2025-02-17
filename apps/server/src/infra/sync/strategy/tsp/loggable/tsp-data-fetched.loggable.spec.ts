import { faker } from '@faker-js/faker';
import { TspDataFetchedLoggable } from './tsp-data-fetched.loggable';

describe(TspDataFetchedLoggable.name, () => {
	describe('getLogMessage is called when daysFetched is greater than 0', () => {
		const setup = () => {
			const tspTeacherCount = faker.number.int();
			const tspStudentCount = faker.number.int();
			const tspClassesCount = faker.number.int();
			const daysFetched = faker.number.int(1);

			const expected = {
				message: `Fetched ${tspTeacherCount} teachers, ${tspStudentCount} students and ${tspClassesCount} classes for the last ${daysFetched} days from TSP`,
				data: {
					tspTeacherCount,
					tspStudentCount,
					tspClassesCount,
					daysFetched,
				},
			};

			return { tspTeacherCount, tspStudentCount, tspClassesCount, daysFetched, expected };
		};

		it('should return a log message', () => {
			const { tspTeacherCount, tspStudentCount, tspClassesCount, daysFetched, expected } = setup();

			const loggable = new TspDataFetchedLoggable(tspTeacherCount, tspStudentCount, tspClassesCount, daysFetched);

			expect(loggable.getLogMessage()).toEqual(expected);
		});
	});

	describe('getLogMessage is called when daysFetched is -1', () => {
		const setup = () => {
			const tspTeacherCount = faker.number.int();
			const tspStudentCount = faker.number.int();
			const tspClassesCount = faker.number.int();
			const daysFetched = -1;

			const expected = {
				message: `Fetched ${tspTeacherCount} teachers, ${tspStudentCount} students and ${tspClassesCount} classes for full sync from TSP.`,
				data: {
					tspTeacherCount,
					tspStudentCount,
					tspClassesCount,
					daysFetched,
				},
			};

			return { tspTeacherCount, tspStudentCount, tspClassesCount, daysFetched, expected };
		};

		it('should return a log message', () => {
			const { tspTeacherCount, tspStudentCount, tspClassesCount, daysFetched, expected } = setup();

			const loggable = new TspDataFetchedLoggable(tspTeacherCount, tspStudentCount, tspClassesCount, daysFetched);

			expect(loggable.getLogMessage()).toEqual(expected);
		});
	});
});
