import { Readable } from 'stream';

export interface IFile {
	name: string;
	buffer: Buffer | Blob | ReadableStream | Readable;
	size: number;
	mimeType: string;
}
