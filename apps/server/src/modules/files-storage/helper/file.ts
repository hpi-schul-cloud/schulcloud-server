import { AxiosResponse } from 'axios';
import { Request } from 'express';
import { Readable } from 'stream';
import { IFile } from '../interface';

export function createFile(
	filename: string,
	transaction: Request | AxiosResponse,
	buffer: Buffer | Blob | ReadableStream | Readable
): IFile {
	const file: IFile = {
		name: decodeURI(filename),
		buffer,
		size: Number(transaction.headers['content-length']),
		mimeType: transaction.headers['content-type'] || '',
	};

	return file;
}
