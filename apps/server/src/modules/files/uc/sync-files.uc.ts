import { Injectable } from '@nestjs/common';
import { Logger } from '@src/core/logger/logger.service';
import { SyncFilesRepo } from '../repo/sync-files.repo';
import { BatchContext, SyncFileItem } from '../types';
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

	async syncFilesForTasks(context: BatchContext): Promise<number> {
		const itemsToSync: SyncFileItem[] = await this.syncFilesRepo.findTaskFilesToSync(context.aggregationSize);
		const numFound = itemsToSync.length;

		await Promise.all(
			Array.from({ length: context.batchSize }).map(async (o, i) => {
				await this.syncBatch(i, itemsToSync);
			})
		);

		return numFound;
	}

	private async syncBatch(i: number, itemsToSync: SyncFileItem[]): Promise<void> {
		let item: SyncFileItem | undefined;
		do {
			item = itemsToSync.shift();
			if (item) {
				// eslint-disable-next-line no-await-in-loop
				await this.syncFile(item);
			}
		} while (item);
	}

	private async syncFile(item: SyncFileItem) {
		try {
			const fileInfo1 = `source file with id = ${item.source.id}, size = ${item.source.size}`;
			this.logger.log(`Start syncing ${fileInfo1}`);

			await this.metadataService.syncMetaData(item);
			// await this.storageService.syncS3File(item);
			await this.metadataService.persist(item);

			const fileInfo2 = `source file id = ${item.source.id}, target file with id = ${item.target?.id || 'undefined'}`;
			this.logger.log(`Successfully synced ${fileInfo2}`);
		} catch (error) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const stack: string = 'stack' in error ? (error as Error).stack : error;

			this.logger.error(`Error syncing source file with id = ${item.source.id}, parentId = ${item.parentId}`);
			this.logger.error(stack);
			await this.metadataService.persistError(item, stack);
		}
	}
}
