import { TspTeachersMigratedLoggable } from './tsp-teachers-migrated.loggable';

describe(TspTeachersMigratedLoggable.name, () => {
	let loggable: TspTeachersMigratedLoggable;

	beforeAll(() => {
		loggable = new TspTeachersMigratedLoggable(10);
	});

	describe('when loggable is initialized', () => {
		it('should be defined', () => {
			expect(loggable).toBeDefined();
		});
	});

	describe('getLogMessage', () => {
		it('should return a log message', () => {
			expect(loggable.getLogMessage()).toEqual({
				message: `Migrated teachers: 10 teachers migrated`,
				data: {
					migratedTeachers: 10,
				},
			});
		});
	});
});
