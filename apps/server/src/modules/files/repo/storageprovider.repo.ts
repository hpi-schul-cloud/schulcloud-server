import CryptoJS from 'crypto-js';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

import { Injectable } from '@nestjs/common';
import { BaseRepo } from '@shared/repo/base.repo';
import { EntityId } from '@shared/domain';
import { Configuration } from '@hpi-schul-cloud/commons';
import { StorageProvider, File } from '../entity';

function decryptAccessKey(secretAccessKey: string): string {
	return secretAccessKey;
	const S3_KEY = Configuration.get('S3_KEY') as string;
	return CryptoJS.AES.decrypt(secretAccessKey, S3_KEY).toString(CryptoJS.enc.Utf8);
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
	findOneById(id: EntityId): Promise<StorageProvider> {
		return this.em.findOneOrFail(StorageProvider, id);
	}

	async deleteFile(file: File): Promise<void> {
		const { storageProvider, bucket, storageFileName } = file;
		const storageProviderEntity = await this.findOneById(storageProvider.id);
		const storageProviderClient = createStorageProviderClient(storageProviderEntity);
		const deletionCommand = new DeleteObjectCommand({ Bucket: bucket, Key: storageFileName });
		await storageProviderClient.send(deletionCommand);
	}
}
