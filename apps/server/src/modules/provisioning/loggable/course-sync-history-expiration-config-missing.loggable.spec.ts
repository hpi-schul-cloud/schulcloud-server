import { CourseSyncHistoryExpirationConfigMissingLoggable } from './course-sync-history-expiration-config-missing.loggable';

describe(CourseSyncHistoryExpirationConfigMissingLoggable.name, () => {
	describe('getLogMessage', () => {
		describe('should return the correct log message', () => {
			const loggable = new CourseSyncHistoryExpirationConfigMissingLoggable();

			const result = loggable.getLogMessage();

			expect(result).toEqual({
				message: 'Course synchronization histories could be created because its expiration period config is missing.',
			});
		});
	});
});
