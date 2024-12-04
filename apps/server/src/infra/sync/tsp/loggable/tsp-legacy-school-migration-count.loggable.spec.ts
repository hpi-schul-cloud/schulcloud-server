import { TspLegacySchoolMigrationCountLoggable } from './tsp-legacy-school-migration-count.loggable';

describe(TspLegacySchoolMigrationCountLoggable.name, () => {
	let loggable: TspLegacySchoolMigrationCountLoggable;

	beforeAll(() => {
		loggable = new TspLegacySchoolMigrationCountLoggable(10);
	});

	describe('when loggable is initialized', () => {
		it('should be defined', () => {
			expect(loggable).toBeDefined();
		});
	});

	describe('getLogMessage', () => {
		it('should return a log message', () => {
			expect(loggable.getLogMessage()).toEqual({
				message: `Found 10 legacy tsp schools to migrate`,
				data: {
					total: 10,
				},
			});
		});
	});
});
