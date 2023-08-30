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
	etag: string | undefined;
	contentType: string | undefined;
	contentLength: number | undefined;
	contentRange: string | undefined;
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
