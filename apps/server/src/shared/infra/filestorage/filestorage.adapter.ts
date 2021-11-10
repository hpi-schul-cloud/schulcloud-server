import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

import { Injectable } from '@nestjs/common';
import { StorageProvider, File } from '@shared/domain';

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
export class FileStorageAdapter {
	async deleteFile(file: File): Promise<void> {
		const { storageProvider, bucket, storageFileName } = file;
		const storageProviderClient = createStorageProviderClient(storageProvider);
		const deletionCommand = new DeleteObjectCommand({ Bucket: bucket, Key: storageFileName });
		await storageProviderClient.send(deletionCommand);
	}
}
