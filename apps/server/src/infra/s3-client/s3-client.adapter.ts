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
		private readonly errorHandler: DomainErrorHandler,
		private readonly clientInjectionToken: string
	) {
		this.logger.setContext(`${S3ClientAdapter.name}:${this.clientInjectionToken}`);
	}

	// is public but only used internally
	public async createBucket(): Promise<void> {
		try {
			await this.createBucketInternal();
		} catch (err) {
			this.handleCreateBucketError(err);
		}
	}

	public async get(path: string, bytesRange?: string): Promise<GetFile> {
		try {
			const result = await this.getFile(path, bytesRange);

			return result;
		} catch (err: unknown) {
			this.handleGetError(err, path);
		}
	}

	public async create(path: string, file: File): Promise<ServiceOutputTypes> {
		try {
			const result = await this.createFile(path, file);

			return result;
		} catch (err: unknown) {
			return this.handleCreateError(err, path, file);
		}
	}

	public async moveToTrash(paths: string[]): Promise<void> {
		try {
			await this.moveFilesToTrash(paths);
		} catch (err: unknown) {
			throw new InternalServerErrorException('S3ClientAdapter:delete', ErrorUtils.createHttpExceptionOptions(err));
		}
	}

	public async moveDirectoryToTrash(path: string, nextMarker?: string): Promise<void> {
		try {
			await this.moveDirectoryToTrashInternal(path, nextMarker);
		} catch (err) {
			throw new InternalServerErrorException(
				'S3ClientAdapter:moveDirectoryToTrash',
				ErrorUtils.createHttpExceptionOptions(err)
			);
		}
	}

	public async restore(paths: string[]): Promise<CopyObjectCommandOutput[]> {
		try {
			const result = await this.restoreFiles(paths);

			return result;
		} catch (err) {
			throw new InternalServerErrorException('S3ClientAdapter:restore', ErrorUtils.createHttpExceptionOptions(err));
		}
	}

	public async copy(paths: CopyFiles[]): Promise<CopyObjectCommandOutput[]> {
		const result = await this.copyFiles(paths);

		return result;
	}

	public async delete(paths: string[]): Promise<void> {
		try {
			await this.deleteFiles(paths);
		} catch (err) {
			throw new InternalServerErrorException('S3ClientAdapter:delete', ErrorUtils.createHttpExceptionOptions(err));
		}
	}

	public async list(params: ListFiles): Promise<ObjectKeysRecursive> {
		try {
			const result = await this.listFiles(params);

			return result;
		} catch (err) {
			throw new NotFoundException(null, ErrorUtils.createHttpExceptionOptions(err, 'S3ClientAdapter:listDirectory'));
		}
	}

	public async head(path: string): Promise<HeadObjectCommandOutput> {
		try {
			const result = await this.getMetaData(path);

			return result;
		} catch (err) {
			this.handleHeadError(err, path);
		}
	}

	public async deleteDirectory(path: string, nextMarker?: string): Promise<void> {
		try {
			await this.deleteDirectoryInternal(path, nextMarker);
		} catch (err) {
			throw new InternalServerErrorException(
				'S3ClientAdapter:deleteDirectory',
				ErrorUtils.createHttpExceptionOptions(err)
			);
		}
	}

	private async getFile(path: string, bytesRange?: string): Promise<GetFile> {
		this.logGetFile(path);

		const req = new GetObjectCommand({
			Bucket: this.config.bucket,
			Key: path,
			Range: bytesRange,
		});

		const data = await this.client.send(req);
		const stream = this.validateAndExtractStreamFromResponse(data);
		const passthrough = stream.pipe(new PassThrough());
		this.setupTimeOutAndErrorHandling(stream, passthrough, path);

		return {
			data: passthrough,
			contentType: data.ContentType,
			contentLength: data.ContentLength,
			contentRange: data.ContentRange,
			etag: data.ETag,
		};
	}

	private async createBucketInternal(): Promise<void> {
		this.logCreateBucket();

		const req = new CreateBucketCommand({ Bucket: this.config.bucket });
		await this.client.send(req);
	}

	private async createFile(path: string, file: File): Promise<ServiceOutputTypes> {
		this.logUploadFiles(path);

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

		this.setupUploadErrorHandling(upload, path, file);

		const commandOutput = await upload.done();

		return commandOutput;
	}

	private async moveFilesToTrash(paths: string[]): Promise<void> {
		if (paths.length === 0) return;

		const copyPaths = paths.map((path) => {
			return { sourcePath: path, targetPath: `${this.deletedFolderName}/${path}` };
		});

		await this.copyFiles(copyPaths);

		// try catch with rollback is not needed,
		// because the second copyRequest try override existing files in trash folder
		await this.deleteFiles(paths);
	}

	private async moveDirectoryToTrashInternal(path: string, nextMarker?: string): Promise<void> {
		this.logMoveDirectoryToTrash(path);

		const data = await this.listObjects(path, nextMarker);
		const filteredPathObjects = this.filterValidPathKeys(data);

		await this.moveFilesToTrash(filteredPathObjects);

		if (data.IsTruncated && data.NextContinuationToken) {
			await this.moveDirectoryToTrashInternal(path, data.NextContinuationToken);
		}
	}

	private async restoreFiles(paths: string[]): Promise<CopyObjectCommandOutput[]> {
		this.logRestoreFiles(paths);

		const copyPaths = paths.map((path) => {
			return { sourcePath: `${this.deletedFolderName}/${path}`, targetPath: path };
		});

		const result = await this.copyFiles(copyPaths);

		// try catch with rollback is not needed,
		// because the second copyRequest try override existing files in trash folder
		const deleteObjects = copyPaths.map((p) => p.sourcePath);
		await this.deleteFiles(deleteObjects);

		return result;
	}

	private async copyFiles(paths: CopyFiles[]): Promise<CopyObjectCommandOutput[]> {
		this.logCopyFiles();

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
	}

	private async deleteFiles(paths: string[]): Promise<void> {
		this.logDeleteFiles(paths);

		if (paths.length === 0) return;

		const pathObjects = paths.map((p) => {
			return { Key: p };
		});
		const req = new DeleteObjectsCommand({
			Bucket: this.config.bucket,
			Delete: { Objects: pathObjects },
		});

		await this.client.send(req);
	}

	private async listFiles(params: ListFiles): Promise<ObjectKeysRecursive> {
		this.logListFiles(params.path);

		const result = await this.listObjectKeysRecursive(params);

		return result;
	}

	private async getMetaData(path: string): Promise<HeadObjectCommandOutput> {
		this.logGetMetadata(path);

		const req = new HeadObjectCommand({
			Bucket: this.config.bucket,
			Key: path,
		});

		const headResponse = await this.client.send(req);

		return headResponse;
	}

	private async deleteDirectoryInternal(path: string, nextMarker?: string): Promise<void> {
		this.logDeleteDirectory(path);

		const data = await this.listObjects(path, nextMarker);
		const filteredPathObjects = this.filterValidPathKeys(data);

		await this.deleteFiles(filteredPathObjects);

		if (data.IsTruncated && data.NextContinuationToken) {
			await this.deleteDirectoryInternal(path, data.NextContinuationToken);
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
	private setupTimeOutAndErrorHandling(sourceStream: Readable, passthroughStream: PassThrough, context: string): void {
		const STREAM_TIMEOUT_MS = 60 * 1000;
		let timeoutTimer: NodeJS.Timeout | undefined;

		const startOrResetTimeout = (): void => {
			this.clearStreamTimeout(timeoutTimer);
			timeoutTimer = this.createStreamTimeout(sourceStream, passthroughStream, context, STREAM_TIMEOUT_MS);
		};

		const cleanup = (): void => {
			this.clearStreamTimeout(timeoutTimer);
		};

		sourceStream.on('data', startOrResetTimeout);
		sourceStream.on('error', (error) => {
			this.logSourceStreamError(error.message, context);
			cleanup();
			this.destroyStreamIfNotDestroyed(passthroughStream, error);
		});
		sourceStream.on('close', cleanup);
		sourceStream.on('end', cleanup);

		passthroughStream.on('error', (error) => {
			this.logPassthroughStreamError(error.message, context);
			cleanup();
			this.destroyStreamIfNotDestroyed(sourceStream);
		});
		passthroughStream.on('close', cleanup);

		startOrResetTimeout();
	}

	/* istanbul ignore next */
	private clearStreamTimeout(timer: NodeJS.Timeout | undefined): void {
		if (timer) {
			clearTimeout(timer);
		}
	}

	/* istanbul ignore next */
	private createStreamTimeout(
		sourceStream: Readable,
		passthroughStream: PassThrough,
		context: string,
		timeoutMs: number
	): NodeJS.Timeout {
		return setTimeout(() => {
			if (sourceStream.destroyed || passthroughStream.destroyed) {
				return;
			}

			this.logStreamUnresponsive(context);
			sourceStream.destroy();
			passthroughStream.destroy();
		}, timeoutMs);
	}

	/* istanbul ignore next */
	private destroyStreamIfNotDestroyed(stream: Readable | PassThrough, error?: Error): void {
		if (!stream.destroyed) {
			stream.destroy(error);
		}
	}

	private setupUploadErrorHandling(upload: Upload, context: string, file: File): void {
		this.setupAbortSignalHandling(upload, context, file.abortSignal);
		this.setupUploadStreamErrorHandling(upload, context, file.data);
	}

	private setupAbortSignalHandling(upload: Upload, context: string, abortSignal?: AbortSignal): void {
		if (!abortSignal) {
			return;
		}

		if (abortSignal.aborted) {
			this.handleUploadAbortion(context, upload, 'uploadAlreadyAborted');

			return;
		}

		abortSignal.addEventListener('abort', () => {
			this.handleUploadAbortion(context, upload, 'uploadAborted');
		});
	}

	private setupUploadStreamErrorHandling(upload: Upload, context: string, data: Readable): void {
		if (data && typeof data === 'object' && 'on' in data) {
			data.on('error', () => {
				this.handleUploadAbortion(context, upload, 'uploadStreamError');
			});
		}
	}

	private handleUploadAbortion(context: string, upload: Upload, action: string): void {
		this.logger.warning(
			new S3ClientActionLoggable('Upload aborted', {
				action,
				objectPath: context,
				bucket: this.config.bucket,
			})
		);

		upload.abort().catch(() => {
			this.logger.warning(
				new S3ClientActionLoggable('Failed to abort upload', {
					action: 'abortUploadError',
					objectPath: context,
					bucket: this.config.bucket,
				})
			);
		});
	}

	private validateAndExtractStreamFromResponse(data: { Body?: unknown }): Readable {
		if (!data.Body || !(data.Body instanceof Readable)) {
			throw new InternalServerErrorException('S3ClientAdapter:get - Invalid response body');
		}

		return data.Body;
	}

	private handleGetError(err: unknown, path: string): never {
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

	private handleCreateBucketError(err: unknown): never {
		if (TypeGuard.isError(err)) {
			this.errorHandler.exec(`${err.message} "${this.config.bucket}"`);
		}
		throw new InternalServerErrorException('S3ClientAdapter:createBucket', ErrorUtils.createHttpExceptionOptions(err));
	}

	private async handleCreateError(err: unknown, path: string, file: File): Promise<ServiceOutputTypes> {
		if (TypeGuard.getValueFromObjectKey(err, 'Code') === 'NoSuchBucket') {
			await this.createBucket();

			return await this.create(path, file);
		}

		throw new InternalServerErrorException('S3ClientAdapter:create', ErrorUtils.createHttpExceptionOptions(err));
	}

	private handleHeadError(err: unknown, path: string): never {
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

	/* istanbul ignore next */
	private logStreamUnresponsive(context: string): void {
		this.logger.info(
			new S3ClientActionLoggable('Stream unresponsive: S3 object key', {
				action: 'checkStreamResponsive',
				objectPath: context,
				bucket: this.config.bucket,
			})
		);
	}

	/* istanbul ignore next */
	private logSourceStreamError(errorMessage: string, context: string): void {
		this.logger.warning(
			new S3ClientActionLoggable(`Source stream error: ${errorMessage}`, {
				action: 'streamError',
				objectPath: context,
				bucket: this.config.bucket,
			})
		);
	}

	/* istanbul ignore next */
	private logPassthroughStreamError(errorMessage: string, context: string): void {
		this.logger.warning(
			new S3ClientActionLoggable(`Passthrough stream error: ${errorMessage}`, {
				action: 'passthroughError',
				objectPath: context,
				bucket: this.config.bucket,
			})
		);
	}

	private logMoveDirectoryToTrash(path: string): void {
		this.logger.debug(
			new S3ClientActionLoggable('Start move directory to trash', {
				action: 'moveDirectoryToTrash',
				objectPath: path,
				bucket: this.config.bucket,
			})
		);
	}

	private logRestoreFiles(paths: string[]): void {
		this.logger.debug(
			new S3ClientActionLoggable('Start restore of files', {
				action: 'restore',
				objectPath: paths,
				bucket: this.config.bucket,
			})
		);
	}

	private logCopyFiles(): void {
		this.logger.debug(
			new S3ClientActionLoggable('Start copy of files', { action: 'copy', bucket: this.config.bucket })
		);
	}

	private logDeleteFiles(paths: string[]): void {
		this.logger.debug(
			new S3ClientActionLoggable('Start delete of files', {
				action: 'delete',
				objectPath: paths,
				bucket: this.config.bucket,
			})
		);
	}

	private logListFiles(path: string): void {
		this.logger.debug(
			new S3ClientActionLoggable('Start list of files', {
				action: 'list',
				objectPath: path,
				bucket: this.config.bucket,
			})
		);
	}

	private logGetMetadata(path: string): void {
		this.logger.debug(
			new S3ClientActionLoggable('Start get metadata of file', {
				action: 'head',
				objectPath: path,
				bucket: this.config.bucket,
			})
		);
	}

	private logDeleteDirectory(path: string): void {
		this.logger.warning(
			new S3ClientActionLoggable('Start delete directory', {
				action: 'deleteDirectory',
				objectPath: path,
				bucket: this.config.bucket,
			})
		);
	}

	private logCreateBucket(): void {
		this.logger.debug(new S3ClientActionLoggable('Start create bucket', { action: 'get', bucket: this.config.bucket }));
	}

	private logGetFile(path: string): void {
		this.logger.debug(
			new S3ClientActionLoggable('Start get file', { action: 'get', objectPath: path, bucket: this.config.bucket })
		);
	}

	private logUploadFiles(path: string): void {
		this.logger.debug(
			new S3ClientActionLoggable('Start upload of files', {
				action: 'create',
				objectPath: path,
				bucket: this.config.bucket,
			})
		);
	}
}
