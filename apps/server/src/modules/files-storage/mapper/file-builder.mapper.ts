import { AxiosResponse } from 'axios';
import { FileInfo } from 'busboy';
import { Request } from 'express';
import internal, { Readable } from 'stream';
import { IFile } from '../interface';

export class FileBuilder {
	private static buildFile(
		name: string,
		buffer: Buffer | Blob | ReadableStream | Readable,
		size: number,
		mimeType: string
	): IFile {
		const file: IFile = {
			name,
			buffer,
			size,
			mimeType,
		};

		return file;
	}

	public static buildFromRequest(
		fileInfo: FileInfo,
		request: Request,
		buffer: Buffer | Blob | ReadableStream | Readable
	): IFile {
		const size = Number(request.get('content-length'));
		const file = FileBuilder.buildFile(fileInfo.filename, buffer, size, fileInfo.mimeType);

		return file;
	}

	public static buildFromResponse(name: string, response: AxiosResponse<internal.Readable>): IFile {
		const size = Number(response.headers['content-length']);
		const mimeType = response.headers['content-type'];
		const file = FileBuilder.buildFile(name, response.data, size, mimeType);

		return file;
	}
}
