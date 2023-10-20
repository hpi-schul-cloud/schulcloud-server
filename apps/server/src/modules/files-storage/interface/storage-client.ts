import internal from 'stream';
import { FileDto } from '../dto';

export interface IGetFileResponse {
	data: internal.Readable;
	contentType: string | undefined;
	contentLength: number | undefined;
	contentRange: string | undefined;
	etag: string | undefined;
}

export interface ICopyFiles {
	sourcePath: string;
	targetPath: string;
}

export interface IStorageClient {
	create(path: string, file: FileDto): unknown;

	get(path: string, bytesRange?: string): unknown;

	moveToTrash(paths: string[]): unknown;

	delete(paths: string[]): unknown;

	restore(paths: string[]): unknown;
}
