import internal from 'stream';
import { IFile } from './file';

export interface IGetFileResponse {
	data: internal.Readable;
	contentType: string | undefined;
	contentLength: number | undefined;
	etag: string | undefined;
}

export interface IStorageClient {
	create(path: string, file: IFile): unknown;

	get(path: string): unknown;
}
