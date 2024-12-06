import { TspSchoolsFetchedLoggable } from './tsp-schools-fetched.loggable';

describe(TspSchoolsFetchedLoggable.name, () => {
	let loggable: TspSchoolsFetchedLoggable;

	beforeAll(() => {
		loggable = new TspSchoolsFetchedLoggable(10, 5);
	});

	describe('when loggable is initialized', () => {
		it('should be defined', () => {
			expect(loggable).toBeDefined();
		});
	});

	describe('getLogMessage', () => {
		it('should return a log message', () => {
			expect(loggable.getLogMessage()).toEqual({
				message: `Fetched 10 schools for the last 5 days from TSP`,
				data: {
					tspSchoolCount: 10,
					daysFetched: 5,
				},
			});
		});
	});
});
