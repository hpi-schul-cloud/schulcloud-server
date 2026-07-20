import { type Loggable, type LoggableMessage } from '@shared/common/loggable';
import { type EntityId } from '@shared/domain/types';

export class SkipFileLoggable implements Loggable {
	constructor(private readonly fileId: EntityId) {}

	public getLogMessage(): LoggableMessage {
		return {
			message: 'Skipping file due to download error',
			data: { fileId: this.fileId, fileName: this.fileName },
		};
	}
}
