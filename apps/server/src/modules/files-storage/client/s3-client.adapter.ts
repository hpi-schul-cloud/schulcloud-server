import {
	CopyObjectCommand,
	CopyObjectCommandOutput,
	CreateBucketCommand,
	DeleteObjectsCommand,
	GetObjectCommand,
	ListObjectsV2Command,
	ListObjectsV2CommandOutput,
	S3Client,
	ServiceOutputTypes,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { LegacyLogger } from '@src/core/logger';
import { Readable } from 'stream';
import { FileDto } from '../dto';
import { ICopyFiles, IGetFileResponse, IStorageClient, S3Config } from '../interface';

@Injectable()
export class S3ClientAdapter implements IStorageClient {
	private deletedFolderName = 'trash';

	constructor(
		@Inject('S3_Client') readonly client: S3Client,
		@Inject('S3_Config') readonly config: S3Config,
		private logger: LegacyLogger
	) {
		this.logger.setContext(S3ClientAdapter.name);
	}

	// is public but only used internally
	public async createBucket() {
		try {
			this.logger.log({ action: 'create bucket', params: { bucket: this.config.bucket } });

			const req = new CreateBucketCommand({ Bucket: this.config.bucket });
			await this.client.send(req);
		} catch (err) {
			if (err instanceof Error) {
				this.logger.error(`${err.message} "${this.config.bucket}"`);
			}
			throw new InternalServerErrorException(err, 'S3ClientAdapter:createBucket');
		}
	}

	public async get(path: string, bytesRange?: string): Promise<IGetFileResponse> {
		try {
			this.logger.log({ action: 'get', params: { path, bucket: this.config.bucket } });

			const req = new GetObjectCommand({
				Bucket: this.config.bucket,
				Key: path,
				Range: bytesRange,
			});

			const data = await this.client.send(req);
			const stream = data.Body as Readable;

			this.checkStreamResponsive(stream, path);
			return {
				data: stream,
				contentType: data.ContentType,
				contentLength: data.ContentLength,
				contentRange: data.ContentRange,
				etag: data.ETag,
			};
		} catch (err) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			if (err.message && err.message === 'NoSuchKey') {
				this.logger.log(`could not find one of the files for deletion with id ${path}`);
				throw new NotFoundException('NoSuchKey');
			}
			throw new InternalServerErrorException(err, 'S3ClientAdapter:get');
		}
	}

	public async create(path: string, file: FileDto): Promise<ServiceOutputTypes> {
		try {
			this.logger.log({ action: 'create', params: { path, bucket: this.config.bucket } });

			const req = {
				Body: file.data,
				Bucket: this.config.bucket,
				Key: path,
				ContentType: file.mimeType,
			};
			const upload = new Upload({
				client: this.client,
				params: req,
			});

			const commandOutput = await upload.done();
			return commandOutput;
		} catch (err) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			if (err.Code && err.Code === 'NoSuchBucket') {
				await this.createBucket();

				return await this.create(path, file);
			}

			throw new InternalServerErrorException(err, 'S3ClientAdapter:create');
		}
	}

	public async moveToTrash(paths: string[]): Promise<CopyObjectCommandOutput[]> {
		try {
			const copyPaths = paths.map((path) => {
				return { sourcePath: path, targetPath: `${this.deletedFolderName}/${path}` };
			});

			const result = await this.copy(copyPaths);

			// try catch with rollback is not needed,
			// because the second copyRequest try override existing files in trash folder
			await this.delete(paths);

			return result;
		} catch (err) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			if (err.response && err.response.Code && err.response.Code === 'NoSuchKey') {
				this.logger.log(`could not find one of the files for deletion with ids ${paths.join(',')}`);
				return [];
			}
			throw new InternalServerErrorException(err, 'S3ClientAdapter:delete');
		}
	}

	public async restore(paths: string[]): Promise<CopyObjectCommandOutput[]> {
		try {
			this.logger.log({ action: 'restore', params: { paths, bucket: this.config.bucket } });

			const copyPaths = paths.map((path) => {
				return { sourcePath: `${this.deletedFolderName}/${path}`, targetPath: path };
			});

			const result = await this.copy(copyPaths);

			// try catch with rollback is not needed,
			// because the second copyRequest try override existing files in trash folder
			const deleteObjects = copyPaths.map((p) => p.sourcePath);
			await this.delete(deleteObjects);

			return result;
		} catch (err) {
			throw new InternalServerErrorException(err, 'S3ClientAdapter:restore');
		}
	}

	public async copy(paths: ICopyFiles[]) {
		try {
			this.logger.log({ action: 'copy', params: { paths, bucket: this.config.bucket } });

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

	public async delete(paths: string[]) {
		this.logger.log({ action: 'delete', params: { paths, bucket: this.config.bucket } });

		const pathObjects = paths.map((p) => {
			return { Key: p };
		});
		const req = new DeleteObjectsCommand({
			Bucket: this.config.bucket,
			Delete: { Objects: pathObjects },
		});

		return this.client.send(req);
	}

	public async list(prefix: string, maxKeys = Infinity) {
		this.logger.log({ action: 'list', params: { prefix, bucket: this.config.bucket } });

		try {
			let files: string[] = [];
			let ret: ListObjectsV2CommandOutput | undefined;

			do {
				const req = new ListObjectsV2Command({
					Bucket: this.config.bucket,
					Prefix: prefix,
					ContinuationToken: ret?.NextContinuationToken,
					MaxKeys: Math.min(maxKeys - files.length, 1000),
				});

				// Iterations are dependent on each other
				// eslint-disable-next-line no-await-in-loop
				ret = await this.client.send(req);

				const returnedFiles =
					ret?.Contents?.filter((o) => o.Key)
						.map((o) => o.Key as string) // Can not be undefined because of filter above
						.map((key) => key.substring(prefix.length)) ?? [];

				files = files.concat(returnedFiles);
			} while (ret?.IsTruncated && ret.NextContinuationToken && files.length < maxKeys);

			return files.slice(0, maxKeys);
		} catch (err) {
			throw new InternalServerErrorException(err, 'S3ClientAdapter:list');
		}
	}

	/* istanbul ignore next */
	private checkStreamResponsive(stream: Readable, context: string) {
		let timer: NodeJS.Timeout;
		const refreshTimeout = () => {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
			if (timer) clearTimeout(timer);
			timer = setTimeout(() => {
				this.logger.log(`Stream unresponsive: S3 object key ${context}`);
				stream.destroy();
			}, 60 * 1000);
		};

		stream.on('data', () => {
			refreshTimeout();
		});
	}
}
