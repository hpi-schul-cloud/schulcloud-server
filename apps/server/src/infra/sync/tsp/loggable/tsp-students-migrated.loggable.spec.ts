import { TspStudentsMigratedLoggable } from './tsp-students-migrated.loggable';

describe(TspStudentsMigratedLoggable.name, () => {
	let loggable: TspStudentsMigratedLoggable;

	beforeAll(() => {
		loggable = new TspStudentsMigratedLoggable(10);
	});

	describe('when loggable is initialized', () => {
		it('should be defined', () => {
			expect(loggable).toBeDefined();
		});
	});

	describe('getLogMessage', () => {
		it('should return a log message', () => {
			expect(loggable.getLogMessage()).toEqual({
				message: `Migrated students: 10 students migrated`,
				data: {
					migratedStudents: 10,
				},
			});
		});
	});
});
