import internal from 'stream';
import { IFile } from './file';

export interface IGetFileResponse {
	data: internal.Readable;
	contentType: string | undefined;
	contentLength: number | undefined;
	etag: string | undefined;
}

export interface IStorageClient {
	uploadFile(folder: string, file: IFile): unknown;

	getFile(path: string): unknown;
}
