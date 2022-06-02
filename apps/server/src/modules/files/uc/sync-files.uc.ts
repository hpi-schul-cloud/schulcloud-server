import { S3Client } from '@aws-sdk/client-s3';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { StorageProviderRepo } from '@shared/repo';
import { Logger } from '@src/core/logger/logger.service';
import { S3Config } from '@src/modules/files-storage/interface';
import { SyncFilesRepo } from '../repo/sync-files.repo';
import { SyncFileItem } from '../types';
import { SyncFilesMetadataService } from './sync-files-metadata.service';
import { ISyncData, SyncFilesStorageService } from './sync-files-storage.service';

@Injectable()
export class SyncFilesUc implements OnModuleInit {
	private destinationClient: S3Client;

	private destinationBucket: string;

	private sourceClients: Map<EntityId, S3Client> = new Map();

	constructor(
		private readonly metadataService: SyncFilesMetadataService,
		private syncFilesRepo: SyncFilesRepo,
		private storageProviderRepo: StorageProviderRepo,
		private storageService: SyncFilesStorageService,
		private logger: Logger,
		@Inject('DESTINATION_S3_CONFIG') readonly config: S3Config
	) {
		this.destinationClient = this.storageService.createStorageProviderClient({
			endpoint: config.endpoint,
			bucket: config.bucket,
			region: config.region,
			accessKeyId: config.accessKeyId,
			secretAccessKey: config.secretAccessKey,
		});
		this.destinationBucket = config.bucket;
		this.logger.setContext(SyncFilesUc.name);
	}

	async onModuleInit() {
		await this.loadProviders();
	}

	async syncFilesForTasks(batchSize = 50): Promise<number> {
		const itemsToSync: SyncFileItem[] = await this.syncFilesRepo.findTaskFilesToSync(Number(batchSize));

		for (let counter = 1; counter < itemsToSync.length + 1; counter += 1) {
			const item = itemsToSync[counter - 1];
			try {
				const progress = `${Number(counter).toString().padStart(Number(batchSize).toString().length)}/${batchSize}`;
				const fileInfo1 = `source file id = ${item.source.id}`;
				this.logger.log(`${progress} Starting file sync ${fileInfo1}`);
				// eslint-disable-next-line no-await-in-loop
				await this.metadataService.syncMetaData(item);
				// eslint-disable-next-line no-await-in-loop
				await this.syncFile(item);
				const fileInfo2 = `source file id = ${item.source.id}, target file id = ${item.target?.id || 'undefined'}`;
				this.logger.log(`${progress} Successfully synced ${fileInfo2}`);
			} catch (error) {
				this.logger.error(`Error syncing source file id = ${item.source.id}, parentId = ${item.parentId}`);
				this.logger.error('stack' in error ? (error as Error).stack : error);
			}
		}

		return itemsToSync.length;
	}

	private async syncFile(item: SyncFileItem): Promise<void> {
		const client = this.sourceClients.get(item.source.storageProviderId);
		if (client) {
			const source: ISyncData = {
				client,
				bucket: item.source.bucket,
				objectPath: item.source.storageFileName,
			};
			const target: ISyncData = {
				client: this.destinationClient,
				bucket: this.destinationBucket,
				objectPath: [item.schoolId, item.target?.id].join('/'),
			};

			await this.storageService.syncFile(source, target);
		} else {
			throw new Error(`Unable to find storage provider with id ${item.source.storageProviderId}`);
		}
	}

	private async loadProviders() {
		const providers = await this.storageProviderRepo.findAll();

		providers.forEach((item) => {
			const client = this.storageService.createStorageProviderClient({
				endpoint: item.endpointUrl,
				region: item.region || 'eu-central-1',
				accessKeyId: item.accessKeyId,
				secretAccessKey: item.secretAccessKey,
				bucket: '',
			});
			this.sourceClients.set(item.id, client);
		});
	}
}
