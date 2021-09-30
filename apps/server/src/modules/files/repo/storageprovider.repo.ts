import { decrypt } from 'crypto-js/aes';
import Utf8 from 'crypto-js/enc-utf8';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

import { Injectable } from '@nestjs/common';
import { BaseRepo } from '@shared/repo/base.repo';
import { Configuration } from '@hpi-schul-cloud/commons';
import { StorageProvider, File } from '../entity';

function decryptAccessKey(secretAccessKey: string): string {
	const S3_KEY = Configuration.get('S3_KEY') as string;
	return decrypt(secretAccessKey, S3_KEY).toString(Utf8);
}

function createStorageProviderClient(provider: StorageProvider): S3Client {
	return new S3Client({
		endpoint: provider.endpointUrl,
		forcePathStyle: true,
		region: provider.region,
		tls: true,
		credentials: {
			accessKeyId: provider.accessKeyId,
			secretAccessKey: decryptAccessKey(provider.secretAccessKey),
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
