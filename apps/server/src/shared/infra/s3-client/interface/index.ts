import { Readable } from 'stream';

export interface S3Config {
	endpoint: string;
	region: string;
	bucket: string;
	accessKeyId: string;
	secretAccessKey: string;
}

export interface GetFile {
	data: Readable;
	etag?: string;
	contentType?: string;
	contentLength?: number;
	contentRange?: string;
}

export interface CopyFiles {
	sourcePath: string;
	targetPath: string;
}

export interface File {
	data: Readable;
	name: string;
	mimeType: string;
}
