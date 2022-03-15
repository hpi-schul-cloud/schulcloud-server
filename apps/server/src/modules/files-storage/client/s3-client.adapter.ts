import {
	CreateBucketCommand,
	GetObjectCommand,
	S3Client,
	ServiceOutputTypes,
	PutObjectCommand,
	PutObjectCommandOutput,
	CopyObjectCommand,
	CopyObjectCommandOutput,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Inject, Injectable } from '@nestjs/common';
import { Readable } from 'stream';

import { ILogger, Logger } from '@src/core/logger';

import { S3Config, IGetFileResponse, IStorageClient, IFile } from '../interface';

@Injectable()
export class S3ClientAdapter implements IStorageClient {
	private logger: ILogger;

	constructor(@Inject('S3_Client') readonly client: S3Client, @Inject('S3_Config') readonly config: S3Config) {
		this.logger = new Logger('S3Client');
	}

	async createBucket() {
		try {
			const req = new CreateBucketCommand({ Bucket: this.config.bucket });
			await this.client.send(req);
		} catch (error) {
			if (error instanceof Error) {
				this.logger.error(`${error.message} "${this.config.bucket}"`);
			}
			throw error;
		}
	}

	public async get(path: string): Promise<IGetFileResponse> {
		const req = new GetObjectCommand({
			Bucket: this.config.bucket,
			Key: path,
		});

		const data = await this.client.send(req);

		return {
			data: data.Body as Readable,
			contentType: data.ContentType,
			contentLength: data.ContentLength,
			etag: data.ETag,
		};
	}

	public async create(path: string, file: IFile): Promise<ServiceOutputTypes> {
		try {
			const req = {
				Body: file.buffer,
				Bucket: this.config.bucket,
				Key: path,
				ContentType: file.mimeType,
			};
			const res = new Upload({
				client: this.client,
				params: req,
			});

			const a = await res.done();

			return a;
		} catch (error) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			if (error.Code && error.Code === 'NoSuchBucket') {
				await this.createBucket();

				return this.create(path, file);
			}
			throw error;
		}
	}

	public async delete(paths: string[], expires: Date): Promise<any[]> {
		this.logger.debug({ action: 'set expires', params: { paths, expires, bucket: this.config.bucket } });

		const requests = paths.map((path) => {
			const req = new CopyObjectCommand({
				Bucket: this.config.bucket,
				CopySource: path,
				Key: path,
				Expires: expires,
			});

			//return this.client.send(req);
		});

		const result = await Promise.all(requests);

		return result;
	}
}
