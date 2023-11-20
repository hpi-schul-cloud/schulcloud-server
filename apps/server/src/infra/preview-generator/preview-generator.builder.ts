import { File } from '@infra/s3-client';
import { PassThrough } from 'stream';
import { PreviewOptions } from './interface';

export class PreviewGeneratorBuilder {
	public static buildFile(preview: PassThrough, previewOptions: PreviewOptions): File {
		const { format } = previewOptions;

		const file = {
			data: preview,
			mimeType: format,
		};

		return file;
	}
}
