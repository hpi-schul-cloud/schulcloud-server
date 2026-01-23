import { Readable } from 'stream';

export interface S3Config {
	endpoint: string;
	region: string;
	bucket: string;
	accessKeyId: string;
	secretAccessKey: string;
}

export interface S3ClientModuleOptions {
	clientInjectionToken: string;
	configInjectionToken: string;
	configConstructor: new () => S3Config;
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
	mimeType: string;
	abortSignal?: AbortSignal;
}

export interface ListFiles {
	path: string;
	maxKeys?: number;
	nextMarker?: string;
	files?: string[];
}

export interface ObjectKeysRecursive {
	path: string;
	maxKeys: number | undefined;
	nextMarker: string | undefined;
	files: string[];
}
