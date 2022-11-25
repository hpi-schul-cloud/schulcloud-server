/* istanbul ignore file */

import { DeleteObjectCommand, GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { StorageProviderRepo } from '@shared/repo';
import { S3Config } from '@src/modules/files-storage/interface/config';
import { SyncFileItem } from '../types';

// Temporary functionality for migration to new fileservice
// TODO: Remove when BC-1496 is done!

export interface ISyncData {
	client: S3Client;
	bucket: string;
	objectPath: string;
}

@Injectable()
export class SyncFilesStorageService implements OnModuleInit {
	private destinationClient: S3Client;

	private sourceClients: Map<EntityId, S3Client> = new Map();

	constructor(
		private storageProviderRepo: StorageProviderRepo,
		@Inject('DESTINATION_S3_CONFIG') readonly config: S3Config
	) {
		this.destinationClient = this.createDestinationProvider(config);
	}

	async onModuleInit() {
		await this.setSourceProviders();
	}

	async syncS3File(item: SyncFileItem): Promise<void> {
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

			await this.syncFile(source, target);
		} else {
			throw new Error(`Unable to find storage provider with id ${item.source.storageProviderId}`);
		}
	}

	async removeFile(path: string) {
		const req = new DeleteObjectCommand({
			Bucket: this.config.bucket,
			Key: path,
		});

		return this.destinationClient.send(req);
	}

	private createDestinationProvider(config: S3Config) {
		const provider = this.createStorageProviderClient({
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
			const client = this.createStorageProviderClient({
				endpoint: item.endpointUrl,
				region: item.region || 'eu-central-1',
				accessKeyId: item.accessKeyId,
				secretAccessKey: item.secretAccessKey,
				bucket: '',
			});
			this.sourceClients.set(item.id, client);
		});
	}

	private createStorageProviderClient(storageProvider: S3Config): S3Client {
		return new S3Client({
			endpoint: storageProvider.endpoint,
			forcePathStyle: true,
			region: storageProvider.region,
			tls: true,
			credentials: {
				accessKeyId: storageProvider.accessKeyId,
				secretAccessKey: storageProvider.secretAccessKey,
			},
		});
	}

	private async syncFile(source: ISyncData, target: ISyncData) {
		const sourceReq = new GetObjectCommand({
			Bucket: source.bucket,
			Key: source.objectPath,
		});
		try {
			const data = await source.client.send(sourceReq);

			const targetReq = {
				Body: data.Body,
				Bucket: target.bucket,
				Key: target.objectPath,
				ContentType: data.ContentType,
			};
			const res = new Upload({
				client: target.client,
				params: targetReq,
			});

			const a = await res.done();

			return a;
		} catch (err) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			if (err.name && err.name === 'NoSuchKey') {
				throw new Error(`S3 file not found: bucket = ${source.bucket}, objectPath = ${source.objectPath}`);
			}
			throw err;
		}
	}
}
