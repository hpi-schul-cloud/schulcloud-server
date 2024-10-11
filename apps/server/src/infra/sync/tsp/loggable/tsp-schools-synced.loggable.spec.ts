import { TspSchoolsSyncedLoggable } from './tsp-schools-synced.loggable';

describe(TspSchoolsSyncedLoggable.name, () => {
	let loggable: TspSchoolsSyncedLoggable;

	beforeAll(() => {
		loggable = new TspSchoolsSyncedLoggable(10, 10, 5, 5);
	});

	describe('when loggable is initialized', () => {
		it('should be defined', () => {
			expect(loggable).toBeDefined();
		});
	});

	describe('getLogMessage', () => {
		it('should return a log message', () => {
			expect(loggable.getLogMessage()).toEqual({
				message: `Synced schools: Of 10 schools 10 were processed. 5 were created and 5 were updated`,
				data: {
					tspSchoolCount: 10,
					processedSchools: 10,
					createdSchools: 5,
					updatedSchools: 5,
				},
			});
		});
	});
});
