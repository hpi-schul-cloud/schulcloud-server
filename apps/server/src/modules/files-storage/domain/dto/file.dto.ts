import { File } from '@infra/s3-client';
import { Readable } from 'stream';

export class FileDto implements File {
	constructor(file: FileDto) {
		this.name = file.name;
		this.data = file.data;
		this.mimeType = file.mimeType;
	}

	public name: string;

	public data: Readable;

	public mimeType: string;
}
