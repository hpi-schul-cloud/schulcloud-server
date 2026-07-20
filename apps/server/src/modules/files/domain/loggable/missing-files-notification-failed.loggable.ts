import { type Loggable, type LoggableMessage } from '@shared/common/loggable';
import { type EntityId } from '@shared/domain/types';

export class MissingFilesNotificationFailedLoggable implements Loggable {
	constructor(
		private readonly userId: EntityId,
		private readonly fileIds: string[]
	) {}

	public getLogMessage(): LoggableMessage {
		return {
			message: 'Failed to create missing files notification',
			data: { userId: this.userId, fileIds: this.fileIds.join(',') },
		};
	}
}
