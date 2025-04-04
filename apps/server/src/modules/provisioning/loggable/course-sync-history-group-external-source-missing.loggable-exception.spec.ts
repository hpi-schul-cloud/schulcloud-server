import { ErrorLogMessage } from '@core/logger';
import { ObjectId } from '@mikro-orm/mongodb';
import { CourseSyncHistoryGroupExternalSourceMissingLoggableException } from './course-sync-history-group-external-source-missing.loggable-exception';

describe(CourseSyncHistoryGroupExternalSourceMissingLoggableException.name, () => {
	describe('getLogMessage', () => {
		it('should return the correct log message', () => {
			const groupId = new ObjectId().toHexString();
			const loggable = new CourseSyncHistoryGroupExternalSourceMissingLoggableException(groupId);

			const result = loggable.getLogMessage();

			expect(result).toEqual<ErrorLogMessage>({
				type: 'COURSE_SYNC_HISTORY_GROUP_EXTERNAL_SOURCE_MISSING',
				stack: loggable.stack,
				data: {
					groupId,
					message:
						`Course synchronization histories linked with the group with id ${groupId} could not be created ` +
						'because the group has unexpectedly no external source.',
				},
			});
		});
	});
});
