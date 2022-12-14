import { ILoggable } from '@src/core/logger/interfaces/loggable';
import { SyncFileItem } from '../types';

export class FileSyncStartLoggable implements ILoggable {
	item: SyncFileItem;

	currentCount: number;

	constructor(item: SyncFileItem, currentCount: number) {
		this.item = item;
		this.currentCount = currentCount;
	}

	getLogMessage() {
		return {
			message: 'start syncing file',
			data: {
				currentCount: this.currentCount,
				sourceFileId: this.item.source.id,
				sourceFileSize: this.item.source.size,
			},
		};
	}
}
