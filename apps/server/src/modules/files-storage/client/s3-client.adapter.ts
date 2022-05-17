import {
	CopyObjectCommand,
	CopyObjectCommandOutput,
	CreateBucketCommand,
	DeleteObjectsCommand,
	GetObjectCommand,
	S3Client,
	ServiceOutputTypes,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { Logger } from '@src/core/logger';
import { Readable } from 'stream';
import { ICopyFiles, IFile, IGetFileResponse, IStorageClient, S3Config } from '../interface';

@Injectable()
export class S3ClientAdapter implements IStorageClient {
	private deletedFolderName = 'trash';

	constructor(
		@Inject('S3_Client') readonly client: S3Client,
		@Inject('S3_Config') readonly config: S3Config,
		private logger: Logger
	) {
		this.logger.setContext(S3ClientAdapter.name);
	}

	// is public but only used internally
	public async createBucket() {
		try {
			this.logger.debug({ action: 'create bucket', params: { bucket: this.config.bucket } });

			const req = new CreateBucketCommand({ Bucket: this.config.bucket });
			await this.client.send(req);
		} catch (err) {
			if (err instanceof Error) {
				this.logger.error(`${err.message} "${this.config.bucket}"`);
			}
			throw new InternalServerErrorException(err, 'S3ClientAdapter:createBucket');
		}
	}

	public async get(path: string): Promise<IGetFileResponse> {
		try {
			this.logger.debug({ action: 'get', params: { path, bucket: this.config.bucket } });

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
		} catch (err) {
			throw new InternalServerErrorException(err, 'S3ClientAdapter:get');
		}
	}

	public async create(path: string, file: IFile): Promise<ServiceOutputTypes> {
		try {
			this.logger.debug({ action: 'create', params: { path, bucket: this.config.bucket } });

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
		} catch (err) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			if (err.Code && err.Code === 'NoSuchBucket') {
				await this.createBucket();

				return this.create(path, file);
			}

			throw new InternalServerErrorException(err, 'S3ClientAdapter:create');
		}
	}

	public async delete(paths: string[]): Promise<CopyObjectCommandOutput[]> {
		try {
			this.logger.debug({ action: 'delete', params: { paths, bucket: this.config.bucket } });

			const copyPaths = paths.map((path) => {
				return { sourcePath: path, targetPath: `${this.deletedFolderName}/${path}` };
			});

			const result = await this.copy(copyPaths);

			// try catch with rollback is not needed,
			// because the second copyRequest try override existing files in trash folder
			await this.remove(paths);

			return result;
		} catch (err) {
			throw new InternalServerErrorException(err, 'S3ClientAdapter:delete');
		}
	}

	public async restore(paths: string[]): Promise<CopyObjectCommandOutput[]> {
		try {
			this.logger.debug({ action: 'restore', params: { paths, bucket: this.config.bucket } });

			const copyPaths = paths.map((path) => {
				return { sourcePath: `${this.deletedFolderName}/${path}`, targetPath: path };
			});

			const result = await this.copy(copyPaths);

			// try catch with rollback is not needed,
			// because the second copyRequest try override existing files in trash folder
			const deleteObjects = copyPaths.map((p) => p.sourcePath);
			await this.remove(deleteObjects);

			return result;
		} catch (err) {
			throw new InternalServerErrorException(err, 'S3ClientAdapter:restore');
		}
	}

	public async copy(paths: ICopyFiles[]) {
		try {
			this.logger.debug({ action: 'copy', params: { paths, bucket: this.config.bucket } });

			const copyRequests = paths.map(async (path) => {
				const req = new CopyObjectCommand({
					Bucket: this.config.bucket,
					CopySource: `${this.config.bucket}/${path.sourcePath}`,
					Key: `${path.targetPath}`,
				});

				const data = await this.client.send(req);

				return data;
			});

			const result = await Promise.all(copyRequests);

			return result;
		} catch (err) {
			throw new InternalServerErrorException(err, 'S3ClientAdapter:copy');
		}
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
