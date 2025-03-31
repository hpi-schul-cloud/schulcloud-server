import { Loggable, LogMessage } from '@core/logger';
import { EntityId } from '@shared/domain/types';

export class CourseSyncHistoryGroupExternalIdMissingLoggable implements Loggable {
	constructor(private readonly groupId: EntityId) {}

	public getLogMessage(): LogMessage {
		return {
			message:
				`Course synchronization histories linked with the group with id ${this.groupId} could not be created ` +
				'because the group has no external id.',
			data: {
				groupId: this.groupId,
			},
		};
	}
}
