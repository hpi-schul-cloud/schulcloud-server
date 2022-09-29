import { Readable } from 'stream';

export class ImsccFileBuilder {
	private readonly defaultFilename = new Date().toISOString();

	private readonly defaultTitle = new Date().toISOString();

	private filename?: string;

	private title?: string;

	build(): Readable {
		const result = {
			title: this.title ?? this.defaultTitle,
		};
		return Readable.from(Object.keys(result));
	}

	addFilename(filename: string): ImsccFileBuilder {
		this.filename = filename;
		return this;
	}

	addTitle(title: string): ImsccFileBuilder {
		this.title = title;
		return this;
	}
}
