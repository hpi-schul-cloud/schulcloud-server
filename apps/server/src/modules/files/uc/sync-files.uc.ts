import { S3Client } from '@aws-sdk/client-s3';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { EntityId, File, FileRecord } from '@shared/domain';
import { FileRecordRepo, StorageProviderRepo } from '@shared/repo';
import { Logger } from '@src/core/logger/logger.service';
import { S3Config } from '@src/modules/files-storage/interface';
import { FileFilerecord } from '../job/sync-filerecords-utils/file_filerecord.entity';
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
		private fileRecordRepo: FileRecordRepo,
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

	async syncFilerecordsForTasks(batchSize = 50) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const tasksToSync: TaskToSync[] = await this.syncFilesRepo.getTasksToSync(Number(batchSize));

		await this.syncMetaData(tasksToSync);
	}

	private async syncMetaData(tasks: TaskToSync[]) {
		const promises = tasks.map((task) => {
			if (task.filerecord) {
				return this.updateFilerecord(task);
			}

			return this.createFilerecord(task);
		});
		const newTasks = await Promise.all(promises);
		await this.syncFiles(newTasks);
	}

	private async updateFilerecord(task: TaskToSync) {
		const { file } = task;
		const filerecord = await this.fileRecordRepo.findOneById(FileRecord, task.filerecord?._id);
		// TODO: Does deletedSince information exist on file? Same for creation below.
		// filerecord.deletedSince = file.
		filerecord.name = file.name;
		filerecord.size = file.size;
		filerecord.mimeType = file.type;
		filerecord.securityCheck = file.securityCheck;
		filerecord._creatorId = file.creator?._id;
		filerecord._lockedForUserId = file.lockId;
		filerecord.createdAt = file.createdAt;
		filerecord.updatedAt = file.updatedAt;

		await this.fileRecordRepo.save(filerecord);
		task.filerecord = filerecord;
		return task;
	}

	private async createFilerecord(item: TaskToSync) {
		const { file } = item;
		const filerecord = new FileRecord({
			size: file.size,
			name: file.name,
			mimeType: file.type,
			parentType: item.parentType,
			parentId: item.parentId,
			creatorId: file.creator?._id,
			schoolId: item.schoolId,
		});

		filerecord.securityCheck = file.securityCheck;
		filerecord._lockedForUserId = file.lockId;
		filerecord.createdAt = file.createdAt;
		filerecord.updatedAt = file.updatedAt;
		await this.fileRecordRepo.save(filerecord);
		item.filerecord = fileFilerecord;

		const fileFilerecord = new FileFilerecord({ fileId: file._id, filerecordId: filerecord._id });
		await this.syncFilesRepo.save(fileFilerecord);
		return item;
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
