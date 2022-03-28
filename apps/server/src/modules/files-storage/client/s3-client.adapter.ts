import {
	CreateBucketCommand,
	GetObjectCommand,
	S3Client,
	ServiceOutputTypes,
	CopyObjectCommand,
	DeleteObjectsCommand,
	CopyObjectCommandOutput,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Inject, Injectable } from '@nestjs/common';
import { Readable } from 'stream';

import { ILogger, Logger } from '@src/core/logger';

import { S3Config, IGetFileResponse, IStorageClient, IFile, ICopyFiles } from '../interface';

@Injectable()
export class S3ClientAdapter implements IStorageClient {
	private logger: ILogger;

	private deletedFolderName = 'trash';

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

	public async delete(paths: string[]): Promise<CopyObjectCommandOutput[]> {
		this.logger.debug({ action: 'delete', params: { paths, bucket: this.config.bucket } });

		const copyPaths = paths.map((path) => {
			return { sourcePath: path, targetPaths: `${this.deletedFolderName}/${path}` };
		});

		const result = await this.copy(copyPaths);

		// try catch with rollback is not needed,
		// because the second copyRequest try override existing files in trash folder
		await this.remove(paths);

		return result;
	}

	public async restore(paths: string[]): Promise<CopyObjectCommandOutput[]> {
		this.logger.debug({ action: 'restore', params: { paths, bucket: this.config.bucket } });

		const copyPaths = paths.map((path) => {
			return { sourcePath: `${this.deletedFolderName}/${path}`, targetPaths: path };
		});

		const result = await this.copy(copyPaths);

		// try catch with rollback is not needed,
		// because the second copyRequest try override existing files in trash folder
		const deleteObjects = copyPaths.map((p) => p.sourcePath);
		await this.remove(deleteObjects);

		return result;
	}

	private async copy(paths: ICopyFiles[]) {
		const copyRequests = paths.map(async (path) => {
			const req = new CopyObjectCommand({
				Bucket: this.config.bucket,
				CopySource: `${this.config.bucket}/${path.sourcePath}`,
				Key: `${path.targetPaths}`,
			});

			const data = await this.client.send(req);

			return data;
		});

		return Promise.all(copyRequests);
	}

	private async remove(paths: string[]) {
		const pathObjects = paths.map((p) => ({ Key: p }));
		const req = new DeleteObjectsCommand({
			Bucket: this.config.bucket,
			Delete: { Objects: pathObjects },
		});

		return this.client.send(req);
	}
}
