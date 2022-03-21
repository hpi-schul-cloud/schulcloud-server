import internal from 'stream';
import type { IFile } from './file';

export interface IGetFileResponse {
	data: internal.Readable;
	contentType: string | undefined;
	contentLength: number | undefined;
	etag: string | undefined;
}

export interface ICopyFiles {
	sourcePath: string;
	targetPaths: string;
}

export interface IStorageClient {
	create(path: string, file: IFile): unknown;

	get(path: string): unknown;

	delete(paths: string[]): unknown;

	restore(paths: string[]): unknown;
}
