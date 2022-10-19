import { FileInfo } from 'busboy';
import { Request } from 'express';
import { Readable } from 'stream';
import { IFile } from '../interface';

export function createFile(info: FileInfo, request: Request, buffer: Buffer | Blob | ReadableStream | Readable) {
	const file: IFile = {
		name: info.filename,
		buffer,
		size: Number(request.get('content-length')),
		mimeType: info.mimeType,
	};

	return file;
}
