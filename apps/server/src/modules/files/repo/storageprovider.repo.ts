/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

import { Injectable } from '@nestjs/common';
import { BaseRepo } from '@shared/repo/base.repo';
import { StorageProvider, File, EntityId } from '@shared/domain';

function createStorageProviderClient(storageProvider: StorageProvider): S3Client {
	return new S3Client({
		endpoint: storageProvider.endpointUrl,
		forcePathStyle: true,
		region: storageProvider.region,
		tls: true,
		credentials: {
			accessKeyId: storageProvider.accessKeyId,
			secretAccessKey: storageProvider.secretAccessKey,
		},
	});
}

@Injectable()
export class FileStorageRepo extends BaseRepo<StorageProvider> {
	async deleteFile(file: File): Promise<void> {
		const { storageProvider, bucket, storageFileName } = file;
		const storageProviderClient = createStorageProviderClient(storageProvider);
		const deletionCommand = new DeleteObjectCommand({ Bucket: bucket, Key: storageFileName });
		await storageProviderClient.send(deletionCommand);
	}

	async findOneById(id: EntityId): Promise<StorageProvider> {
		const storageProvider = await this.em.findOneOrFail(StorageProvider, id);
		return storageProvider;
	}
}
