import {
	CopyObjectCommand,
	CopyObjectCommandOutput,
	CreateBucketCommand,
	DeleteObjectCommandOutput,
	DeleteObjectsCommand,
	GetObjectCommand,
	HeadObjectCommand,
	HeadObjectCommandOutput,
	ListObjectsV2Command,
	PutObjectCommandInput,
	S3Client,
	ServiceOutputTypes,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ErrorUtils } from '@src/core/error/utils';
import { LegacyLogger } from '@src/core/logger';
import { Readable } from 'stream';
import { TypeGuard } from '@shared/common';
import { S3_CLIENT, S3_CONFIG } from './constants';
import { CopyFiles, File, GetFile, ListFiles, ObjectKeysRecursive, S3Config } from './interface';

@Injectable()
export class S3ClientAdapter {
	private deletedFolderName = 'trash';

	constructor(
		@Inject(S3_CLIENT) readonly client: S3Client,
		@Inject(S3_CONFIG) readonly config: S3Config,
		private logger: LegacyLogger
	) {
		this.logger.setContext(S3ClientAdapter.name);
	}

	// is public but only used internally
	public async createBucket(): Promise<void> {
		try {
			this.logger.debug({ action: 'create bucket', params: { bucket: this.config.bucket } });

			const req = new CreateBucketCommand({ Bucket: this.config.bucket });
			await this.client.send(req);
		} catch (err) {
			if (TypeGuard.isError(err)) {
				this.logger.error(`${err.message} "${this.config.bucket}"`);
			}
			throw new InternalServerErrorException(
				'S3ClientAdapter:createBucket',
				ErrorUtils.createHttpExceptionOptions(err)
			);
		}
	}

	public async get(path: string, bytesRange?: string): Promise<GetFile> {
		try {
			this.logger.debug({ action: 'get', params: { path, bucket: this.config.bucket } });

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
		} catch (err: unknown) {
			if (TypeGuard.getValueFromObjectKey(err, 'Code') === 'NoSuchKey') {
				this.logger.warn(`Could not get file with id ${path}`);
				throw new NotFoundException('NoSuchKey', ErrorUtils.createHttpExceptionOptions(err));
			} else {
				throw new InternalServerErrorException('S3ClientAdapter:get', ErrorUtils.createHttpExceptionOptions(err));
			}
		}
	}

	public async create(path: string, file: File): Promise<ServiceOutputTypes> {
		try {
			this.logger.debug({ action: 'create', params: { path, bucket: this.config.bucket } });

			const req: PutObjectCommandInput = {
				Body: file.data,
				Bucket: this.config.bucket,
				Key: path,
				ContentType: file.mimeType,
			};

			console.log(this.client);
			const upload = new Upload({
				client: this.client,
				params: req,
			});

			const commandOutput = await upload.done();

			return commandOutput;
		} catch (err: unknown) {
			if (TypeGuard.getValueFromObjectKey(err, 'Code') === 'NoSuchBucket') {
				await this.createBucket();

				return await this.create(path, file);
			}

			throw new InternalServerErrorException('S3ClientAdapter:create', ErrorUtils.createHttpExceptionOptions(err));
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
		} catch (err: unknown) {
			if (TypeGuard.getValueFromDeepObjectKey(err, ['cause', 'name']) === 'NoSuchKey') {
				this.logger.warn(`could not find one of the files for deletion with ids ${paths.join(',')}`);

				return [];
			}
			throw new InternalServerErrorException('S3ClientAdapter:delete', ErrorUtils.createHttpExceptionOptions(err));
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
			await this.delete(deleteObjects);

			return result;
		} catch (err) {
			throw new InternalServerErrorException('S3ClientAdapter:restore', ErrorUtils.createHttpExceptionOptions(err));
		}
	}

	public async copy(paths: CopyFiles[]): Promise<CopyObjectCommandOutput[]> {
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
			throw new InternalServerErrorException('S3ClientAdapter:copy', ErrorUtils.createHttpExceptionOptions(err));
		}
	}

	public async delete(paths: string[]): Promise<DeleteObjectCommandOutput> {
		try {
			this.logger.debug({ action: 'delete', params: { paths, bucket: this.config.bucket } });

			const pathObjects = paths.map((p) => {
				return { Key: p };
			});
			const req = new DeleteObjectsCommand({
				Bucket: this.config.bucket,
				Delete: { Objects: pathObjects },
			});

			const result = await this.client.send(req);

			return result;
		} catch (err) {
			throw new InternalServerErrorException('S3ClientAdapter:delete', ErrorUtils.createHttpExceptionOptions(err));
		}
	}

	public async list(params: ListFiles): Promise<ObjectKeysRecursive> {
		try {
			this.logger.debug({ action: 'list', params });

			const result = await this.listObjectKeysRecursive(params);

			return result;
		} catch (err) {
			throw new NotFoundException(null, ErrorUtils.createHttpExceptionOptions(err, 'S3ClientAdapter:listDirectory'));
		}
	}

	private async listObjectKeysRecursive(params: ListFiles): Promise<ObjectKeysRecursive> {
		const { path, maxKeys, nextMarker } = params;
		let files: string[] = params.files ? params.files : [];
		const MaxKeys = maxKeys && maxKeys - files.length;

		const req = new ListObjectsV2Command({
			Bucket: this.config.bucket,
			Prefix: path,
			ContinuationToken: nextMarker,
			MaxKeys,
		});

		const data = await this.client.send(req);

		const returnedFiles =
			data?.Contents?.filter((o) => o.Key)
				.map((o) => o.Key as string) // Can not be undefined because of filter above
				.map((key) => key.substring(path.length)) ?? [];

		files = files.concat(returnedFiles);

		let res: ObjectKeysRecursive = { path, maxKeys, nextMarker: data?.ContinuationToken, files };

		if (data?.IsTruncated && (!maxKeys || res.files.length < maxKeys)) {
			res = await this.listObjectKeysRecursive(res);
		}

		return res;
	}

	public async head(path: string): Promise<HeadObjectCommandOutput> {
		try {
			this.logger.debug({ action: 'head', params: { path, bucket: this.config.bucket } });

			const req = new HeadObjectCommand({
				Bucket: this.config.bucket,
				Key: path,
			});

			const headResponse = await this.client.send(req);

			return headResponse;
		} catch (err) {
			if (TypeGuard.getValueFromObjectKey(err, 'message') === 'NoSuchKey') {
				this.logger.warn(`could not find the file for head with id ${path}`);
				throw new NotFoundException(null, ErrorUtils.createHttpExceptionOptions(err, 'NoSuchKey'));
			}
			throw new InternalServerErrorException(null, ErrorUtils.createHttpExceptionOptions(err, 'S3ClientAdapter:head'));
		}
	}

	public async deleteDirectory(path: string): Promise<void> {
		try {
			this.logger.debug({ action: 'deleteDirectory', params: { path, bucket: this.config.bucket } });

			const req = new ListObjectsV2Command({
				Bucket: this.config.bucket,
				Prefix: path,
			});

			const data = await this.client.send(req);

			if (data.Contents?.length && data.Contents?.length > 0) {
				const pathObjects = data.Contents.map((p) => p.Key);

				const filteredPathObjects = pathObjects.filter((p): p is string => !!p);

				await this.delete(filteredPathObjects);
			}
		} catch (err) {
			throw new InternalServerErrorException(
				'S3ClientAdapter:deleteDirectory',
				ErrorUtils.createHttpExceptionOptions(err)
			);
		}
	}

	/* istanbul ignore next */
	private checkStreamResponsive(stream: Readable, context: string): void {
		let timer: NodeJS.Timeout;
		const refreshTimeout = () => {
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
