import { TspTeachersFetchedLoggable } from './tsp-teachers-fetched.loggable';

describe(TspTeachersFetchedLoggable.name, () => {
	let loggable: TspTeachersFetchedLoggable;

	beforeAll(() => {
		loggable = new TspTeachersFetchedLoggable(10);
	});

	describe('when loggable is initialized', () => {
		it('should be defined', () => {
			expect(loggable).toBeDefined();
		});
	});

	describe('getLogMessage', () => {
		it('should return a log message', () => {
			expect(loggable.getLogMessage()).toEqual({
				message: `Fetched 10 teachers for migration from TSP`,
				data: {
					tspTeacherCount: 10,
				},
			});
		});
	});
});
