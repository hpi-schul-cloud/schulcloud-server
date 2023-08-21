import { AxiosResponse } from 'axios';
import { FileInfo } from 'busboy';
import { Readable } from 'stream';
import { FileDto } from '../dto/file.dto';

export class FileDtoBuilder {
	public static build(name: string, data: Readable, mimeType: string): FileDto {
		const file = new FileDto({ name, data, mimeType });

		return file;
	}

	public static buildFromRequest(fileInfo: FileInfo, data: Readable): FileDto {
		const file = FileDtoBuilder.build(fileInfo.filename, data, fileInfo.mimeType);

		return file;
	}

	public static buildFromAxiosResponse(name: string, response: AxiosResponse<Readable>): FileDto {
		const mimeType = response.headers['content-type'];
		const file = FileDtoBuilder.build(name, response.data, mimeType);

		return file;
	}
}
