import { Readable } from 'stream';
import { File } from '@infra/s3-client';

export class H5pFileDto implements File {
	constructor(file: H5pFileDto) {
		this.name = file.name;
		this.data = file.data;
		this.mimeType = file.mimeType;
	}

	name: string;

	data: Readable;

	mimeType: string;
}

export interface GetH5pFileResponse {
	data: Readable;
	etag?: string;
	contentType?: string;
	contentLength?: number;
	contentRange?: string;
	name: string;
}

export interface GetLibraryFile {
	data: Readable;
	contentType: string;
	contentLength: number;
	contentRange?: { start: number; end: number };
}
