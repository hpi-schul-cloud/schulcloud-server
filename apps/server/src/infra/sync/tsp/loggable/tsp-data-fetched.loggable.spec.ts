import { TspDataFetchedLoggable } from './tsp-data-fetched.loggable';

describe(TspDataFetchedLoggable.name, () => {
	let loggable: TspDataFetchedLoggable;

	beforeAll(() => {
		loggable = new TspDataFetchedLoggable(1, 2, 3, 4);
	});

	describe('when loggable is initialized', () => {
		it('should be defined', () => {
			expect(loggable).toBeDefined();
		});
	});

	describe('getLogMessage', () => {
		it('should return a log message', () => {
			expect(loggable.getLogMessage()).toEqual({
				message: `Fetched 1 teachers, 2 students and 3 classes for the last 4 days from TSP`,
				data: {
					tspTeacherCount: 1,
					tspStudentCount: 2,
					tspClassesCount: 3,
					daysFetched: 4,
				},
			});
		});
	});
});
