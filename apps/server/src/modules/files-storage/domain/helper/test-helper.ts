import { GetFile } from '@infra/s3-client';
import { Readable } from 'stream';
import { GetFileResponse } from '../interface';

export class TestHelper {
	public static createFile = (props?: { contentRange?: string; mimeType?: string }): GetFile => {
		const text = 'testText';
		const readable = Readable.from(text);

		const fileResponse = {
			data: readable,
			contentType: props?.mimeType ?? 'image/webp',
			contentLength: text.length,
			contentRange: props?.contentRange,
			etag: 'testTag',
		};

		return fileResponse;
	};

	public static createFileResponse = (contentRange?: string): GetFileResponse => {
		const name = 'testName';
		const file = this.createFile({ contentRange });
		const fileResponse = { ...file, name };

		return fileResponse;
	};
}
