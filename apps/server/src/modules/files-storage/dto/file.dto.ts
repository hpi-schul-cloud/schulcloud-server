import { Readable } from 'stream';

export class FileDto {
	constructor(file: FileDto) {
		this.name = file.name;
		this.buffer = file.buffer;
		this.size = file.size;
		this.mimeType = file.mimeType;
	}

	name: string;

	buffer: Buffer | Blob | ReadableStream | Readable;

	size: number;

	mimeType: string;
}
