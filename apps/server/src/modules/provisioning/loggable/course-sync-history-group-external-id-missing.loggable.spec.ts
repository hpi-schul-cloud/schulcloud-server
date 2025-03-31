import { LogMessage } from '@core/logger';
import { ObjectId } from '@mikro-orm/mongodb';
import { CourseSyncHistoryGroupExternalIdMissingLoggable } from './course-sync-history-group-external-id-missing.loggable';

describe(CourseSyncHistoryGroupExternalIdMissingLoggable.name, () => {
	describe('getLogMessage', () => {
		it('should return the correct log message', () => {
			const groupId = new ObjectId().toHexString();
			const loggable = new CourseSyncHistoryGroupExternalIdMissingLoggable(groupId);

			const result = loggable.getLogMessage();

			expect(result).toEqual<LogMessage>({
				message:
					`Course synchronization histories linked with the group with id ${groupId} could not be created ` +
					'because the group has no external id.',
				data: {
					groupId,
				},
			});
		});
	});
});
