import { Loggable } from '@src/core/logger/interfaces/loggable';
import { SyncFileItem } from '../types';

export class FileSyncSuccessLoggable implements Loggable {
	item: SyncFileItem;

	currentCount: number;

	constructor(item: SyncFileItem, currentCount: number) {
		this.item = item;
		this.currentCount = currentCount;
	}

	getLogMessage(): unknown {
		return {
			message: `Successfully synced a file`,
			data: {
				currentCount: this.currentCount,
				sourceFileId: this.item.source.id,
				targetFileId: this.item.target?.id,
				operation: this.item.created ? 'created' : 'updated',
			},
		};
	}
}
