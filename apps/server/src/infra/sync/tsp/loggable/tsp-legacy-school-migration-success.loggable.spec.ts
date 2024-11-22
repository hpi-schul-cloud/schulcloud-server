import { TspLegacySchoolMigrationSuccessLoggable } from './tsp-legacy-school-migration-success.loggable';

describe(TspLegacySchoolMigrationSuccessLoggable.name, () => {
	let loggable: TspLegacySchoolMigrationSuccessLoggable;

	beforeAll(() => {
		loggable = new TspLegacySchoolMigrationSuccessLoggable(10, 5);
	});

	describe('when loggable is initialized', () => {
		it('should be defined', () => {
			expect(loggable).toBeDefined();
		});
	});

	describe('getLogMessage', () => {
		it('should return a log message', () => {
			expect(loggable.getLogMessage()).toEqual({
				message: `Legacy tsp data migration finished. Total schools: 10, migrated schools: 5`,
				data: {
					total: 10,
					migrated: 5,
				},
			});
		});
	});
});
