import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { S3Config } from '@src/modules/files-storage/interface';

export interface ISyncData {
	client: S3Client;
	bucket: string;
	objectPath: string;
}

@Injectable()
export class SyncFilesStorageService {
	public async syncFile(source: ISyncData, target: ISyncData) {
		const sourceReq = new GetObjectCommand({
			Bucket: source.bucket,
			Key: source.objectPath,
		});

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
	}

	public createStorageProviderClient(storageProvider: S3Config): S3Client {
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
}
