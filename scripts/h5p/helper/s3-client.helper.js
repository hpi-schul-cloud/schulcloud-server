const {
	DeleteObjectsCommand,
	GetObjectCommand,
	ListObjectsV2Command,
	S3Client,
	PutObjectCommand,
} = require('@aws-sdk/client-s3');
const { ConfiguredRetryStrategy, RETRY_MODES } = require('@aws-sdk/util-retry');

const MAXIMUM_ATTEMPTS = 3;
const BACKOFF_DELAY_TIME_MS = 5000;

class S3ClientHelper {
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

		const retryStrategy = new ConfiguredRetryStrategy(MAXIMUM_ATTEMPTS, (attempt) => attempt * BACKOFF_DELAY_TIME_MS);

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

	async getFileContent(key) {
		const command = new GetObjectCommand({
			Bucket: this.bucket,
			Key: key,
		});
		const response = await this.s3Client.send(command);
		const chunks = [];
		for await (const chunk of response.Body) {
			chunks.push(chunk);
		}
		const result = Buffer.concat(chunks);

		return result;
	}

	async listObjects(prefix = undefined) {
		const command = new ListObjectsV2Command({
			Bucket: this.bucket,
			Prefix: prefix,
		});
		const response = await this.s3Client.send(command);
		const result = response.Contents || [];

		return result;
	}

	async uploadFile(key, body) {
		const command = new PutObjectCommand({
			Bucket: this.bucket,
			Key: key,
			Body: body,
		});
		const result = await this.s3Client.send(command);

		return result;
	}

	async deleteFolder(path, nextMarker = undefined) {
		const data = await this.listObjects(path, nextMarker);
		if (data.length === 0) {
			return [];
		}

		const paths = data.map((obj) => obj.Key);
		const result = await this.delete(paths);
		if (data.IsTruncated && data.NextContinuationToken) {
			const deletedFiles = await this.deleteDirectory(path, data.NextContinuationToken);
			result.push(...deletedFiles);
		}

		return result;
	}

	async delete(paths) {
		const result = [];
		if (paths.length === 0) return [];

		const pathObjects = paths.map((p) => {
			return { Key: p };
		});
		const command = new DeleteObjectsCommand({
			Bucket: this.bucket,
			Delete: { Objects: pathObjects },
		});
		const response = await this.s3Client.send(command);
		if (response.$metadata.httpStatusCode === 200 && response.Deleted) {
			const deletedFiles = response.Deleted.map((obj) => obj.Key);
			result.push(...deletedFiles);
		}

		return result;
	}
}

module.exports = S3ClientHelper;
