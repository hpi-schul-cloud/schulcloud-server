import {
	DeleteObjectsCommand,
	GetObjectCommand,
	ListObjectsV2Command,
	ListObjectsV2CommandOutput,
	PutObjectCommand,
	PutObjectCommandOutput,
	S3Client,
} from '@aws-sdk/client-s3';
import { ConfiguredRetryStrategy, RETRY_MODES } from '@aws-sdk/util-retry';
import { Readable } from 'stream';

export class S3ClientHelper {
	private readonly MAXIMUM_ATTEMPTS = 3;
	private readonly BACKOFF_DELAY_TIME_MS = 5000;
	private readonly S3_MAX_DEFAULT_VALUE_FOR_KEYS = 1000;

	private bucket: string | undefined;
	private s3Client: S3Client;

	constructor() {
		const endpoint = process.env.H5P_EDITOR__S3_ENDPOINT;
		if (!endpoint) {
			throw new Error('H5P_EDITOR__S3_ENDPOINT environment variable is not set');
		}
		const region = process.env.H5P_EDITOR__S3_REGION;
		if (!region) {
			throw new Error('H5P_EDITOR__S3_REGION environment variable is not set');
		}
		const accessKeyId = process.env.H5P_EDITOR__LIBRARIES_S3_ACCESS_KEY_ID;
		if (!accessKeyId) {
			throw new Error('H5P_EDITOR__LIBRARIES_S3_ACCESS_KEY_ID environment variable is not set');
		}
		const secretAccessKey = process.env.H5P_EDITOR__LIBRARIES_S3_SECRET_ACCESS_KEY;
		if (!secretAccessKey) {
			throw new Error('H5P_EDITOR__LIBRARIES_S3_SECRET_ACCESS_KEY environment variable is not set');
		}
		this.bucket = process.env.H5P_EDITOR__S3_BUCKET_LIBRARIES;
		if (!this.bucket) {
			throw new Error('H5P_EDITOR__S3_BUCKET_LIBRARIES environment variable is not set');
		}

		const retryStrategy = new ConfiguredRetryStrategy(
			this.MAXIMUM_ATTEMPTS,
			(attempt) => attempt * this.BACKOFF_DELAY_TIME_MS
		);

		this.s3Client = new S3Client({
			region,
			credentials: {
				accessKeyId,
				secretAccessKey,
			},
			endpoint,
			forcePathStyle: true,
			tls: true,
			retryMode: RETRY_MODES.STANDARD,
			retryStrategy,
		});
	}

	public async getFileContent(key: string, bytesRange?: string): Promise<Buffer> {
		const command = new GetObjectCommand({
			Bucket: this.bucket,
			Key: key,
			Range: bytesRange,
		});

		const response = await this.s3Client.send(command);
		const stream = response.Body as Readable;

		const chunks: Buffer[] = [];
		for await (const chunk of stream) {
			chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
		}
		const result = Buffer.concat(chunks);

		return result;
	}

	public async listObjects(
		prefix: string,
		nextMarker?: string,
		maxKeys = this.S3_MAX_DEFAULT_VALUE_FOR_KEYS
	): Promise<ListObjectsV2CommandOutput> {
		const req = new ListObjectsV2Command({
			Bucket: this.bucket,
			Prefix: prefix,
			ContinuationToken: nextMarker,
			MaxKeys: maxKeys,
		});

		const data = await this.s3Client.send(req);

		return data;
	}

	public async uploadFile(key: string, body: Buffer | string): Promise<PutObjectCommandOutput> {
		const command = new PutObjectCommand({
			Bucket: this.bucket,
			Key: key,
			Body: body,
		});
		const result = await this.s3Client.send(command);

		return result;
	}

	public async deleteFolder(path: string, nextMarker?: string): Promise<string[]> {
		const data = await this.listObjects(path, nextMarker);
		if (!data.Contents || data.Contents.length === 0) {
			return [];
		}

		const paths = data.Contents.filter((obj): obj is { Key: string } => typeof obj.Key === 'string').map(
			(obj) => obj.Key
		);

		const result = await this.delete(paths);

		if (data.IsTruncated && data.NextContinuationToken) {
			const deletedFiles = await this.deleteFolder(path, data.NextContinuationToken);
			result.push(...deletedFiles);
		}

		return result;
	}

	private async delete(paths: string[]): Promise<string[]> {
		const result: string[] = [];

		if (paths.length === 0) {
			return [];
		}

		const pathObjects = paths.map((p) => {
			return { Key: p };
		});
		const command = new DeleteObjectsCommand({
			Bucket: this.bucket,
			Delete: { Objects: pathObjects },
		});

		const response = await this.s3Client.send(command);

		if (response.$metadata.httpStatusCode === 200 && response.Deleted) {
			const stringKeyObjects = response.Deleted.filter((obj) => this.isObjectWithAStringKey(obj));
			const deletedFiles = stringKeyObjects.map((obj) => obj.Key);
			result.push(...deletedFiles);
		}

		return result;
	}

	private isObjectWithAStringKey(obj: unknown): obj is { Key: string } {
		return typeof obj === 'object' && obj !== null && 'Key' in obj && typeof (obj as any).Key === 'string';
	}
}
