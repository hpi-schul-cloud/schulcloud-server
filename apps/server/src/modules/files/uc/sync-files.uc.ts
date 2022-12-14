/* istanbul ignore file */

import { Injectable } from '@nestjs/common';
import { Logger } from '@src/core/logger/logger.service';
import { FileRecordParentType } from '@src/modules/files-storage/entity/filerecord.entity';
import { AggregationEmptyLoggable } from '../loggables/aggregation-empty.loggable';
import { AggregationStartLoggable } from '../loggables/aggregation-start.loggable';
import { FileSyncFailLoggable } from '../loggables/filesync-fail.loggable';
import { FileSyncStartLoggable } from '../loggables/filesync-start.loggable';
import { FileSyncSuccessLoggable } from '../loggables/filesync-success.loggable';
import { SyncFilesRepo } from '../repo/sync-files.repo';
import { FileSyncOptions, SyncContext, SyncFileItem } from '../types';
import { SyncFilesMetadataService } from './sync-files-metadata.service';
import { SyncFilesStorageService } from './sync-files-storage.service';

// Temporary functionality for migration to new fileservice
// TODO: Remove when BC-1496 is done!
@Injectable()
export class SyncFilesUc {
	constructor(
		private readonly metadataService: SyncFilesMetadataService,
		private syncFilesRepo: SyncFilesRepo,
		private storageService: SyncFilesStorageService,
		private logger: Logger
	) {
		this.logger.setContext(SyncFilesUc.name);
	}

	async syncFilesForParentType(parentType: FileRecordParentType, aggregationSize = 5000, numParallelPromises = 50) {
		let itemsFound: number;
		let aggregationsCounter = 0;
		const options = new FileSyncOptions(aggregationSize, numParallelPromises);

		do {
			// this.logger.log(new AggregationStartLoggable(aggregationsCounter, options));
			const context = { fileCounter: aggregationsCounter * Number(aggregationSize) };
			// eslint-disable-next-line no-await-in-loop
			const itemsToSync: SyncFileItem[] = await this.syncFilesRepo.findFilesToSync(parentType, options.aggregationSize);
			// eslint-disable-next-line no-await-in-loop
			itemsFound = await this.syncFiles(itemsToSync, options, context);

			aggregationsCounter += 1;
		} while (itemsFound > 0);
	}

	async syncFiles(itemsToSync: SyncFileItem[], options: FileSyncOptions, context: SyncContext): Promise<number> {
		const numFound = itemsToSync.length;

		if (numFound > 0) {
			const initilizedArray = Array.from({ length: options.numParallelPromises });
			const promises = initilizedArray.map(() => this.syncBatch(itemsToSync, context));
			await Promise.all(promises);
		} else {
			// this.logger.log(new AggregationEmptyLoggable());
		}

		return numFound;
	}

	private async syncBatch(itemsToSync: SyncFileItem[], context: SyncContext): Promise<void> {
		let item: SyncFileItem | undefined;
		do {
			item = itemsToSync.shift();
			if (item) {
				// eslint-disable-next-line no-await-in-loop
				await this.syncFile(item, context);
			}
		} while (item);
	}

	private async syncFile(item: SyncFileItem, context: SyncContext) {
		try {
			context.fileCounter += 1;
			const currentCount = context.fileCounter;
			// this.logger.log(new FileSyncStartLoggable(item, currentCount));

			await this.metadataService.prepareMetaData(item);
			await this.storageService.syncS3File(item);
			await this.metadataService.persistMetaData(item);

			// this.logger.log(new FileSyncSuccessLoggable(item, currentCount));
		} catch (error) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const stack: string = 'stack' in error ? (error as Error).stack : error;

			// this.logger.warn(new FileSyncFailLoggable(item, stack));

			await this.metadataService.persistError(item.source.id, stack);
		}
	}
}
