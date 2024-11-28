import { TspStudentsFetchedLoggable } from './tsp-students-fetched.loggable';

describe(TspStudentsFetchedLoggable.name, () => {
	let loggable: TspStudentsFetchedLoggable;

	beforeAll(() => {
		loggable = new TspStudentsFetchedLoggable(10);
	});

	describe('when loggable is initialized', () => {
		it('should be defined', () => {
			expect(loggable).toBeDefined();
		});
	});

	describe('getLogMessage', () => {
		it('should return a log message', () => {
			expect(loggable.getLogMessage()).toEqual({
				message: `Fetched 10 students for migration from TSP`,
				data: {
					tspStudentCount: 10,
				},
			});
		});
	});
});
