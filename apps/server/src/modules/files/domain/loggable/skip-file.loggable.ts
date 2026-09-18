import { type Loggable, type LoggableMessage } from '@shared/common/loggable';
import { type EntityId } from '@shared/domain/types';

export class SkipFileLoggable implements Loggable {
	constructor(
		private readonly fileId: EntityId,
		private readonly reason?: string
	) {}

	public getLogMessage(): LoggableMessage {
		return {
			message: 'Skipping file due to download error',
			data: { fileId: this.fileId, reason: this.reason },
		};
	}
}
