import internal from 'stream';
import type { IFile } from './file';

export interface IGetFileResponse {
	data: internal.Readable;
	contentType: string | undefined;
	contentLength: number | undefined;
	etag: string | undefined;
}

export interface IStorageClient {
	create(path: string, file: IFile): unknown;

	get(path: string): unknown;

	setExpires(path: string, expires: Date): unknown;

	setManyExpires(path: string[], expires: Date): unknown;
}
