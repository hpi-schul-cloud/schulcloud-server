/* istanbul ignore file */

import { Injectable } from '@nestjs/common';
import { Loggable } from '@src/core/Logger-POC/interfaces/loggable';
import { Logger } from '@src/core/logger/logger.service';
import { FileRecordParentType } from '@src/modules/files-storage/entity/filerecord.entity';
import { SyncFilesRepo } from '../repo/sync-files.repo';
import { FileSyncOptions, SyncContext, SyncFileItem } from '../types';
import { SyncFilesMetadataService } from './sync-files-metadata.service';
import { SyncFilesStorageService } from './sync-files-storage.service';

class SyncrunSuccessLoggable implements Loggable {
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
			this.logStartingAggregation(aggregationsCounter, options);
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
			this.logItemNotFound();
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
			this.logStartSyncing(item, currentCount);

			await this.metadataService.prepareMetaData(item);
			await this.storageService.syncS3File(item);
			await this.metadataService.persistMetaData(item);

			this.logger.log(new SyncrunSuccessLoggable(item, currentCount));
		} catch (error) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const stack: string = 'stack' in error ? (error as Error).stack : error;

			this.logError(item, stack);
			await this.metadataService.persistError(item.source.id, stack);
		}
	}

	private logStartingAggregation(aggregationsCounter: number, options: FileSyncOptions) {
		this.logger.log(
			`Starting file sync: aggregation #${aggregationsCounter + 1} with aggregationSize = ${
				options.aggregationSize
			} and numParallelPromises = ${options.numParallelPromises}`
		);
	}

	private logStartSyncing(item: SyncFileItem, currentCount: number): void {
		const fileInfo = `source file with id = ${item.source.id}, size = ${item.source.size}`;
		this.logger.log(`#${currentCount} Start syncing ${fileInfo}`);
	}

	private logSuccessfullySynced(item: SyncFileItem, currentCount: number): void {
		const fileInfo = `source file id = ${item.source.id}, target file with id = ${item.target?.id || 'undefined'}`;
		const operation = item.created ? 'created' : 'updated';
		this.logger.log(`#${currentCount} Successfully synced ${fileInfo} (${operation})`);
	}

	private logError(item: SyncFileItem, stack: string) {
		this.logger.error(`Error syncing source file with id = ${item.source.id}, parentId = ${item.parentId}`);
		this.logger.error(stack);
	}

	private logItemNotFound() {
		this.logger.log('Not items found. Nothing to do.');
	}
}
