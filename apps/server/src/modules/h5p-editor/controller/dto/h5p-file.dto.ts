import { Readable } from 'stream';

export class H5pFileDto {
	constructor(file: H5pFileDto) {
		this.name = file.name;
		this.data = file.data;
		this.mimeType = file.mimeType;
	}

	name: string;

	data: Readable;

	mimeType: string;
}
