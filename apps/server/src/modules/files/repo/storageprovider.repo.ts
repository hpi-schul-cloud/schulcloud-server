import CryptoJS from 'crypto-js';
import AWS from 'aws-sdk/global';
import S3 from 'aws-sdk/clients/s3';

import { Injectable } from '@nestjs/common';
import { BaseRepo } from '@shared/repo/base.repo';
import { EntityId } from '@shared/domain';
import { Configuration } from '@hpi-schul-cloud/commons';
import { StorageProvider, File } from '../entity';

const HOST = Configuration.get('HOST') as string;

function getAWSConfig(provider: StorageProvider): AWS.Config {
	const awsConfig = new AWS.Config({
		signatureVersion: 'v4',
		s3ForcePathStyle: true,
		sslEnabled: true,
		accessKeyId: provider.accessKeyId,
		secretAccessKey: provider.secretAccessKey,
		region: provider.region,
		// @ts-ignore
		cors_rules: {
			AllowedHeaders: ['*'],
			AllowedMethods: ['PUT'],
			AllowedOrigins: [HOST],
			MaxAgeSeconds: 300,
		},
	});
	// @ts-ignore
	awsConfig.endpoint = new AWS.Endpoint(provider.endpointUrl);
	return awsConfig;
}

function decryptAccessKey(secretAccessKey: string): string {
	const S3_KEY = Configuration.get('S3_KEY') as string;
	return CryptoJS.AES.decrypt(secretAccessKey, S3_KEY).toString(CryptoJS.enc.Utf8);
}

const createStorageProviderInstance = (storageProviderMetaInformation) =>
	new S3(getAWSConfig(storageProviderMetaInformation));

@Injectable()
export class FileStorageRepo extends BaseRepo<StorageProvider> {
	async findOneById(id: EntityId): Promise<StorageProvider> {
		const storageProvider = await this.em.findOneOrFail(StorageProvider, id);
		storageProvider.secretAccessKey = decryptAccessKey(storageProvider.secretAccessKey);
		return storageProvider;
	}

	async deleteFile(file: File): Promise<void> {
		const { storageProviderId, bucket, storageFileName } = file;
		const storageProvider = await this.findOneById(storageProviderId);
		const storageProviderInstance = createStorageProviderInstance(storageProvider);
		await storageProviderInstance.deleteObject({ Bucket: bucket, Key: storageFileName }).promise();
	}
}
