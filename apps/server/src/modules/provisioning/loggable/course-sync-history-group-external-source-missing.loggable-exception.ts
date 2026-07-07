import { UnprocessableEntityException } from '@nestjs/common';
import { Loggable, LoggableMessage } from '@shared/common/loggable';
import { EntityId } from '@shared/domain/types';

export class CourseSyncHistoryGroupExternalSourceMissingLoggableException
	extends UnprocessableEntityException
	implements Loggable
{
	constructor(private readonly groupId: EntityId) {
		super();
	}

	public getLogMessage(): LoggableMessage {
		return {
			type: 'COURSE_SYNC_HISTORY_GROUP_EXTERNAL_SOURCE_MISSING',
			stack: this.stack,
			data: {
				message:
					`Course synchronization histories linked with the group with id ${this.groupId} could not be created ` +
					'because the group has unexpectedly no external source.',
				groupId: this.groupId,
			},
		};
	}
}
