import { PreviewFileOptions } from '@infra/preview-generator';
import { PreviewFileParams } from '../interface';

export class PreviewFileOptionsMapper {
	public static fromPreviewFileParams(params: PreviewFileParams): PreviewFileOptions {
		const { originFilePath, previewFilePath, previewParams, format } = params;

		const payload = {
			originFilePath,
			previewFilePath,
			previewOptions: {
				format,
				width: previewParams.width,
			},
		};

		return payload;
	}
}
