import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Injectable, NotImplementedException } from '@nestjs/common';
import { File, StorageProvider } from '@shared/domain';

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
		if (file.isDirectory) {
			throw new NotImplementedException('nest legacy files adapter does not support deleting directories');
		}
		const storageProvider = file.storageProvider as StorageProvider;
		const bucket = file.bucket as string;
		const storageFileName = file.storageFileName as string;
		const storageProviderClient = createStorageProviderClient(storageProvider);
		const deletionCommand = new DeleteObjectCommand({ Bucket: bucket, Key: storageFileName });
		await storageProviderClient.send(deletionCommand);
	}
}
