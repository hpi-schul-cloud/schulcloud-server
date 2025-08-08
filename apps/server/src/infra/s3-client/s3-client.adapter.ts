import {
	CopyObjectCommand,
	CopyObjectCommandOutput,
	CreateBucketCommand,
	DeleteObjectsCommand,
	GetObjectCommand,
	HeadObjectCommand,
	HeadObjectCommandOutput,
	ListObjectsV2Command,
	ListObjectsV2CommandOutput,
	PutObjectCommandInput,
	S3Client,
	ServiceOutputTypes,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { DomainErrorHandler } from '@core/error';
import { ErrorUtils } from '@core/error/utils';
import { Logger } from '@core/logger';
import { InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { TypeGuard } from '@shared/common/guards';
import { PassThrough, Readable } from 'stream';
import { CopyFiles, File, GetFile, ListFiles, ObjectKeysRecursive, S3Config } from './interface';
import { S3ClientActionLoggable } from './loggable';

export class S3ClientAdapter {
	private readonly deletedFolderName = 'trash';
	private readonly S3_MAX_DEFAULT_VALUE_FOR_KEYS = 1000;

	constructor(
		private readonly client: S3Client,
		private readonly config: S3Config,
		private readonly logger: Logger,
		private readonly errorHandler: DomainErrorHandler
	) {
		this.logger.setContext(`${S3ClientAdapter.name}:${config.connectionName}`);
	}

	// is public but only used internally
	public async createBucket(): Promise<void> {
		try {
			this.logger.debug(
				new S3ClientActionLoggable('Start create bucket', { action: 'get', bucket: this.config.bucket })
			);

			const req = new CreateBucketCommand({ Bucket: this.config.bucket });
			await this.client.send(req);
		} catch (err) {
			if (TypeGuard.isError(err)) {
				this.errorHandler.exec(`${err.message} "${this.config.bucket}"`);
			}
			throw new InternalServerErrorException(
				'S3ClientAdapter:createBucket',
				ErrorUtils.createHttpExceptionOptions(err)
			);
		}
	}

	public async get(path: string, bytesRange?: string): Promise<GetFile> {
		try {
			this.logger.debug(
				new S3ClientActionLoggable('Start get file', { action: 'get', objectPath: path, bucket: this.config.bucket })
			);

			const req = new GetObjectCommand({
				Bucket: this.config.bucket,
				Key: path,
				Range: bytesRange,
			});

			const data = await this.client.send(req);
			const stream = data.Body as Readable;
			const passthrough = stream.pipe(new PassThrough());

			this.checkStreamResponsive(stream, path);

			return {
				data: passthrough,
				contentType: data.ContentType,
				contentLength: data.ContentLength,
				contentRange: data.ContentRange,
				etag: data.ETag,
			};
		} catch (err: unknown) {
			if (TypeGuard.getValueFromObjectKey(err, 'Code') === 'NoSuchKey') {
				this.logger.warning(
					new S3ClientActionLoggable('Could not get file with id', {
						action: 'get',
						objectPath: path,
						bucket: this.config.bucket,
					})
				);
				throw new NotFoundException('NoSuchKey', ErrorUtils.createHttpExceptionOptions(err));
			} else {
				throw new InternalServerErrorException('S3ClientAdapter:get', ErrorUtils.createHttpExceptionOptions(err));
			}
		}
	}

	public async create(path: string, file: File): Promise<ServiceOutputTypes> {
		try {
			this.logger.debug(
				new S3ClientActionLoggable('Start upload of files', {
					action: 'create',
					objectPath: path,
					bucket: this.config.bucket,
				})
			);

			const req: PutObjectCommandInput = {
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
		} catch (err: unknown) {
			if (TypeGuard.getValueFromObjectKey(err, 'Code') === 'NoSuchBucket') {
				await this.createBucket();

				return await this.create(path, file);
			}

			throw new InternalServerErrorException('S3ClientAdapter:create', ErrorUtils.createHttpExceptionOptions(err));
		}
	}

	public async moveToTrash(paths: string[]): Promise<void> {
		try {
			if (paths.length === 0) return;

			const copyPaths = paths.map((path) => {
				return { sourcePath: path, targetPath: `${this.deletedFolderName}/${path}` };
			});

			await this.copy(copyPaths);

			// try catch with rollback is not needed,
			// because the second copyRequest try override existing files in trash folder
			await this.delete(paths);
		} catch (err: unknown) {
			throw new InternalServerErrorException('S3ClientAdapter:delete', ErrorUtils.createHttpExceptionOptions(err));
		}
	}

	public async moveDirectoryToTrash(path: string, nextMarker?: string): Promise<void> {
		try {
			this.logger.debug(
				new S3ClientActionLoggable('Start move directory to trash', {
					action: 'moveDirectoryToTrash',
					objectPath: path,
					bucket: this.config.bucket,
				})
			);

			const data = await this.listObjects(path, nextMarker);
			const filteredPathObjects = this.filterValidPathKeys(data);

			await this.moveToTrash(filteredPathObjects);

			if (data.IsTruncated && data.NextContinuationToken) {
				await this.moveDirectoryToTrash(path, data.NextContinuationToken);
			}
		} catch (err) {
			throw new InternalServerErrorException(
				'S3ClientAdapter:moveDirectoryToTrash',
				ErrorUtils.createHttpExceptionOptions(err)
			);
		}
	}

	public async restore(paths: string[]): Promise<CopyObjectCommandOutput[]> {
		try {
			this.logger.debug(
				new S3ClientActionLoggable('Start restore of files', {
					action: 'restore',
					objectPath: paths,
					bucket: this.config.bucket,
				})
			);

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
			this.logger.debug(
				new S3ClientActionLoggable('Start copy of files', { action: 'copy', bucket: this.config.bucket })
			);

			const copyRequests = paths.map(async (path) => {
				const req = new CopyObjectCommand({
					Bucket: this.config.bucket,
					CopySource: `${this.config.bucket}/${path.sourcePath}`,
					Key: `${path.targetPath}`,
				});

				const data = await this.client.send(req);

				return data;
			});

			const settledPromises = await Promise.allSettled(copyRequests);
			const result = this.handleSettledPromises(settledPromises, 'S3ClientAdapter:copy:settledPromises');

			return result;
		} catch (err) {
			throw new InternalServerErrorException('S3ClientAdapter:copy', ErrorUtils.createHttpExceptionOptions(err));
		}
	}

	private handleSettledPromises<T>(settled: PromiseSettledResult<T>[], errorMessage: string): T[] {
		const rejected = settled.filter((p) => p.status === 'rejected');
		if (rejected.length > 0) {
			const reasons = rejected.map((p: PromiseRejectedResult): unknown => p.reason);
			this.errorHandler.exec(new Error(errorMessage, ErrorUtils.createHttpExceptionOptions(reasons)));
		}

		const result = settled.filter((p) => p.status === 'fulfilled').map((p) => p.value);

		return result;
	}

	public async delete(paths: string[]): Promise<void> {
		try {
			this.logger.debug(
				new S3ClientActionLoggable('Start delete of files', {
					action: 'delete',
					objectPath: paths,
					bucket: this.config.bucket,
				})
			);

			if (paths.length === 0) return;

			const pathObjects = paths.map((p) => {
				return { Key: p };
			});
			const req = new DeleteObjectsCommand({
				Bucket: this.config.bucket,
				Delete: { Objects: pathObjects },
			});

			await this.client.send(req);
		} catch (err) {
			throw new InternalServerErrorException('S3ClientAdapter:delete', ErrorUtils.createHttpExceptionOptions(err));
		}
	}

	public async list(params: ListFiles): Promise<ObjectKeysRecursive> {
		try {
			this.logger.debug(
				new S3ClientActionLoggable('Start list of files', {
					action: 'list',
					objectPath: params.path,
					bucket: this.config.bucket,
				})
			);

			const result = await this.listObjectKeysRecursive(params);

			return result;
		} catch (err) {
			throw new NotFoundException(null, ErrorUtils.createHttpExceptionOptions(err, 'S3ClientAdapter:listDirectory'));
		}
	}

	private async listObjectKeysRecursive(params: ListFiles): Promise<ObjectKeysRecursive> {
		const { path, maxKeys, nextMarker } = params;
		let files: string[] = params.files ?? [];
		const MaxKeys = maxKeys && maxKeys - files.length;

		const data = await this.listObjects(path, nextMarker, MaxKeys);

		const returnedFiles =
			data?.Contents?.filter((o): o is { Key: string } => typeof o.Key === 'string')
				.map((o) => o.Key)
				.map((key) => key.substring(path.length)) ?? [];

		files = files.concat(returnedFiles);

		let res: ObjectKeysRecursive = { path, maxKeys, nextMarker: data.NextContinuationToken, files };

		if (data?.IsTruncated && (!maxKeys || res.files.length < maxKeys)) {
			res = await this.listObjectKeysRecursive(res);
		}

		return res;
	}

	public async head(path: string): Promise<HeadObjectCommandOutput> {
		try {
			this.logger.debug(
				new S3ClientActionLoggable('Start get metadata of file', {
					action: 'head',
					objectPath: path,
					bucket: this.config.bucket,
				})
			);

			const req = new HeadObjectCommand({
				Bucket: this.config.bucket,
				Key: path,
			});

			const headResponse = await this.client.send(req);

			return headResponse;
		} catch (err) {
			if (TypeGuard.getValueFromObjectKey(err, 'message') === 'NoSuchKey') {
				this.logger.warning(
					new S3ClientActionLoggable('could not find the file', {
						action: 'head',
						objectPath: path,
						bucket: this.config.bucket,
					})
				);
				throw new NotFoundException(null, ErrorUtils.createHttpExceptionOptions(err, 'NoSuchKey'));
			}
			throw new InternalServerErrorException(null, ErrorUtils.createHttpExceptionOptions(err, 'S3ClientAdapter:head'));
		}
	}

	public async deleteDirectory(path: string, nextMarker?: string): Promise<void> {
		try {
			this.logger.warning(
				new S3ClientActionLoggable('Start delete directory', {
					action: 'deleteDirectory',
					objectPath: path,
					bucket: this.config.bucket,
				})
			);

			const data = await this.listObjects(path, nextMarker);
			const filteredPathObjects = this.filterValidPathKeys(data);

			await this.delete(filteredPathObjects);

			if (data.IsTruncated && data.NextContinuationToken) {
				await this.deleteDirectory(path, data.NextContinuationToken);
			}
		} catch (err) {
			throw new InternalServerErrorException(
				'S3ClientAdapter:deleteDirectory',
				ErrorUtils.createHttpExceptionOptions(err)
			);
		}
	}

	private async listObjects(
		path: string,
		nextMarker?: string,
		maxKeys = this.S3_MAX_DEFAULT_VALUE_FOR_KEYS
	): Promise<ListObjectsV2CommandOutput> {
		const req = new ListObjectsV2Command({
			Bucket: this.config.bucket,
			Prefix: path,
			ContinuationToken: nextMarker,
			MaxKeys: maxKeys,
		});

		const data = await this.client.send(req);

		return data;
	}

	private filterValidPathKeys(data: ListObjectsV2CommandOutput): string[] {
		let filteredPathObjects: string[] = [];

		if (data.Contents) {
			const pathObjects = data.Contents.map((p) => p.Key);

			filteredPathObjects = pathObjects.filter((p): p is string => !!p);
		}

		return filteredPathObjects;
	}

	/* istanbul ignore next */
	private checkStreamResponsive(stream: Readable, context: string): void {
		let timer: NodeJS.Timeout;
		const refreshTimeout = (): void => {
			if (timer) clearTimeout(timer);
			timer = setTimeout(() => {
				if (stream.destroyed) return;

				this.logger.info(
					new S3ClientActionLoggable('Stream unresponsive: S3 object key', {
						action: 'checkStreamResponsive',
						objectPath: context,
						bucket: this.config.bucket,
					})
				);
				stream.destroy();
			}, 60 * 1000);
		};

		stream.on('data', () => {
			refreshTimeout();
		});
	}
}
