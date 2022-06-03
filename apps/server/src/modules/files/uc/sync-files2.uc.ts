/* eslint-disable no-await-in-loop */
import { S3Client } from '@aws-sdk/client-s3';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { EntityId, FileRecord } from '@shared/domain';
import { StorageProviderRepo, SchoolRepo } from '@shared/repo';
import { Logger } from '@src/core/logger/logger.service';
import { S3Config } from '@src/modules/files-storage/interface';
import { SyncFilesRepo } from '../repo/sync-files.repo';
import { SyncFileItem } from '../types';
import { SyncFilesMetadataService } from './sync-files-metadata.service';
import { ISyncData, SyncFilesStorageService } from './sync-files-storage.service';

type Options = {
	limit: number;
	timestamp: Date;
};

enum IsModified {
	mustDeleted,
	createNew,
	isUpdated,
	nothingIsChanged,
}

type Files = {
	_id: EntityId;
	provider: EntityId;
	isModified?: IsModified;
	destinationFiles?: FileRecord[];
};

type Parent = {
	_id: EntityId;
	schoolId: EntityId;
	filesIds: EntityId[];
	isModified?: IsModified;
	sourceFiles?: Files[];
};

@Injectable()
export class SyncFilesUc implements OnModuleInit {
	private destinationClient: S3Client;

	private sourceClients: Map<EntityId, S3Client> = new Map();

	constructor(
		private readonly metadataService: SyncFilesMetadataService,
		private syncFilesRepo: SyncFilesRepo,
		private schoolRepo: SchoolRepo,
		private storageProviderRepo: StorageProviderRepo,
		private storageService: SyncFilesStorageService,
		private logger: Logger,
		@Inject('DESTINATION_S3_CONFIG') readonly config: S3Config
	) {
		this.logger.setContext(SyncFilesUc.name);
		this.destinationClient = this.createDestinationProvider(config);
	}

	async onModuleInit() {
		await Promise.all([this.setSourceProviders()]);
	}

	private createDestinationProvider(config: S3Config) {
		const provider = this.storageService.createStorageProviderClient({
			endpoint: config.endpoint,
			bucket: config.bucket,
			region: config.region,
			accessKeyId: config.accessKeyId,
			secretAccessKey: config.secretAccessKey,
		});

		return provider;
	}

	private async setSourceProviders() {
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
				bucket: this.config.bucket,
				objectPath: [item.schoolId, item.target?.id].join('/'),
			};

			await this.storageService.syncFile(source, target);
		} else {
			throw new Error(`Unable to find storage provider with id ${item.source.storageProviderId}`);
		}
	}

	private async loadParent(options: Options, skip: number) {
		const parents = await this.syncFilesRepo.loadParent({ skip, limit: options.limit }, options.timestamp);

		return parents;
	}

	private async populateFilesForParents(parents: Parent[]) {

		return;
	}

	private checkModified(parents: Parent[]) {
		// for...
		// this.checkIfFilesOfParentIsChanged
		// set IsModified enum based on what must we do
	}

	private checkIfFilesOfParentIsChanged(parent: Parent) {
		//
	}

	private async populateExistingFileRecords(parents: Parent[]) {
		// load from jump tabel
		// load from fileRecords
	}

	async loop(options: Options) {
		let running = true;
		let skip = 0;

		while (running) {
			const parents = await this.loadParent(options, skip);
			if (parents.length <= 0) {
				running = false;
			}
			skip += parents.length;

			await this.populateFilesForParents(parents);

			await this.populateExistingFileRecords(parents);

			this.checkModified(parents);

			// create array of job from parents and sub files, multiple destination files

			// execute jobs for example 10-20 to same time
				// execute delete only see enum
				// execute create only see enum
				// execute updates include delete/create see enum
				// --> each must also update the jump/ref tabel ..this table need sourceFileId -> destinationFileId[]
				// --> each of them handle fileRecord and S3 operations
		}
	}

	// !!! problem if it is break we need the time of the last run !!!
	async main() {
		const timestampOfLastRun = Date.now();
		this.logger.log(timestampOfLastRun);

		const options = {
			timestamp: new Date('1995-12-17T03:24:00'), // initial if no first exist otherwise take what is passed from controller/console
			limit: 50,
		};

		await this.loop(options); // until finished modified options.timestamp with timestampOfLastRun and save Date.now()
	}
}
