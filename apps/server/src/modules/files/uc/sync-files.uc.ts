import { S3Client } from '@aws-sdk/client-s3';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { EntityId, File } from '@shared/domain';
import { StorageProviderRepo } from '@shared/repo';
import { Logger } from '@src/core/logger/logger.service';
import { S3Config } from '@src/modules/files-storage/interface';
import { ISyncData, SyncFilesService } from '../job/sync-filerecords-utils/sync-files.service';
import { SyncTaskRepo } from '../job/sync-filerecords-utils/sync-task.repo';
import { TaskToSync } from '../job/sync-filerecords.console';

@Injectable()
export class SyncFilesUc implements OnModuleInit {
	private destinationClient: S3Client;

	private destinationBucket: string;

	private sourceClients: Map<EntityId, S3Client> = new Map();

	constructor(
		private syncFilesRepo: SyncTaskRepo,
		private storageProviderRepo: StorageProviderRepo,
		private syncFilesService: SyncFilesService,
		private logger: Logger,
		@Inject('Destination_S3_Config') readonly config: S3Config
	) {
		this.destinationClient = this.syncFilesService.createStorageProviderClient({
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

	public async syncFiles(data: TaskToSync[]) {
		const res: { source: ISyncData; target: ISyncData }[] = [];

		data.forEach((item) => {
			const client = this.sourceClients.get((item.file as File).storageProvider.id);
			if (client) {
				const source: ISyncData = {
					client,
					bucket: (item.file as File).bucket,
					objectPath: (item.file as File).storageFileName,
				};
				const target: ISyncData = {
					client: this.destinationClient,
					bucket: this.destinationBucket,
					objectPath: [item.schoolId, item.filerecord?.id].join('/'),
				};

				res.push({ source, target });
			}
		});
		await Promise.all(res.map((item) => this.syncFilesService.syncFile(item.source, item.target)));
	}

	private async loadProviders() {
		const providers = await this.storageProviderRepo.findAll();

		providers.forEach((item) => {
			const client = this.syncFilesService.createStorageProviderClient({
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
