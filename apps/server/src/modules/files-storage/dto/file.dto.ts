import { Readable } from 'stream';

export class FileDto {
	constructor(file: FileDto) {
		this.name = file.name;
		this.data = file.data;
		this.mimeType = file.mimeType;
	}

	name: string;

	data: Readable;

	mimeType: string;
}
