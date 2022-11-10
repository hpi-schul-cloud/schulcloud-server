import { AxiosResponse } from 'axios';
import { FileInfo } from 'busboy';
import { Request } from 'express';
import internal, { Readable } from 'stream';
import { FileDto } from '../dto/file.dto';

export class FileDtoBuilder {
	private static build(
		name: string,
		buffer: Buffer | Blob | ReadableStream | Readable,
		size: number,
		mimeType: string
	): FileDto {
		const file = new FileDto({ name, buffer, size, mimeType });

		return file;
	}

	public static buildFromRequest(
		fileInfo: FileInfo,
		request: Request,
		buffer: Buffer | Blob | ReadableStream | Readable
	): FileDto {
		const size = Number(request.get('content-length'));
		const file = FileDtoBuilder.build(fileInfo.filename, buffer, size, fileInfo.mimeType);

		return file;
	}

	public static buildFromAxiosResponse(name: string, response: AxiosResponse<internal.Readable>): FileDto {
		const size = Number(response.headers['content-length']);
		const mimeType = response.headers['content-type'];
		const file = FileDtoBuilder.build(name, response.data, size, mimeType);

		return file;
	}
}
