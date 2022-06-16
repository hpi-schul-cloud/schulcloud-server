/* istanbul ignore file */

import { Injectable } from '@nestjs/common';
import { Logger } from '@src/core/logger/logger.service';
import { SyncFilesRepo } from '../repo/sync-files.repo';
import { SyncContext, SyncOptions, SyncFileItem } from '../types';
import { SyncFilesMetadataService } from './sync-files-metadata.service';
import { SyncFilesStorageService } from './sync-files-storage.service';

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

	async syncFilesForTasks(options: SyncOptions, context: SyncContext): Promise<number> {
		const itemsToSync: SyncFileItem[] = await this.syncFilesRepo.findTaskFilesToSync(options.aggregationSize);
		const numFound = itemsToSync.length;

		if (numFound > 0) {
			const initilizedArray = Array.from({ length: options.numParallelPromises });
			const promises = initilizedArray.map(() => this.syncBatch(itemsToSync, context));
			await Promise.all(promises);
		} else {
			this.logger.log('Not items found. Nothing to do.');
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

	private logStartSyncing(item: SyncFileItem, context: SyncContext): void {
		const fileInfo = `source file with id = ${item.source.id}, size = ${item.source.size}`;
		this.logger.log(`#${context.fileCounter} Start syncing ${fileInfo}`);
	}

	private logSuccessfullySynced(item: SyncFileItem, context: SyncContext): void {
		const fileInfo = `source file id = ${item.source.id}, target file with id = ${item.target?.id || 'undefined'}`;
		const operation = item.created ? 'created' : 'updated';
		this.logger.log(`#${context.fileCounter} Successfully synced ${fileInfo} (${operation})`);
	}

	private logError(item: SyncFileItem, stack: string) {
		this.logger.error(`Error syncing source file with id = ${item.source.id}, parentId = ${item.parentId}`);
		this.logger.error(stack);
	}

	private async syncFile(item: SyncFileItem, context: SyncContext) {
		try {
			context.fileCounter += 1;
			this.logStartSyncing(item, context);

			await this.metadataService.syncMetaData(item);
			await this.storageService.syncS3File(item);
			await this.metadataService.persist(item);

			this.logSuccessfullySynced(item, context);
		} catch (error) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const stack: string = 'stack' in error ? (error as Error).stack : error;

			this.logError(item, stack);
			await this.metadataService.persistError(item, stack);
		}
	}
}
