import { Readable } from 'stream';
import { IGetFile, IGetFileResponse } from '../interface';

export class TestHelper {
	public static createFile = (contentRange?: string): IGetFile => {
		const text = 'testText';
		const readable = Readable.from(text);

		const fileResponse = {
			data: readable,
			contentType: 'image/webp',
			contentLength: text.length,
			contentRange,
			etag: 'testTag',
		};

		return fileResponse;
	};

	public static createFileResponse = (contentRange?: string): IGetFileResponse => {
		const name = 'testName';
		const file = this.createFile(contentRange);
		const fileResponse = { ...file, name };

		return fileResponse;
	};
}
