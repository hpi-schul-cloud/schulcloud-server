import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

import { Injectable } from '@nestjs/common';
import { BaseRepo } from '@shared/repo/base.repo';
import { StorageProvider, File } from '@shared/domain';

function createStorageProviderClient(provider: StorageProvider): S3Client {
	return new S3Client({
		endpoint: provider.endpointUrl,
		forcePathStyle: true,
		region: provider.region,
		tls: true,
		credentials: {
			accessKeyId: provider.accessKeyId,
			secretAccessKey: provider.secretAccessKey,
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
}
