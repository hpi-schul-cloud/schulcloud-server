import { PreviewFileOptions } from '@infra/preview-generator';
import { PreviewParams } from '../api/dto';
import { FileRecord } from '../domain';
import { createPreviewNameHash, getFormat } from '../domain/helper';
import { PreviewFileParams } from '../domain/interface';

export class PreviewBuilder {
	public static buildParams(
		fileRecord: FileRecord,
		previewParams: PreviewParams,
		bytesRange: string | undefined
	): PreviewFileParams {
		const { id, mimeType } = fileRecord;
		const originFilePath = fileRecord.createPath();
		const format = getFormat(previewParams.outputFormat ?? mimeType);

		const hash = createPreviewNameHash(id, previewParams);
		const previewFilePath = fileRecord.createPreviewFilePath(hash);

		const previewFileParams = {
			fileRecord,
			previewParams,
			hash,
			previewFilePath,
			originFilePath,
			format,
			bytesRange,
		};

		return previewFileParams;
	}

	public static buildPayload(params: PreviewFileParams): PreviewFileOptions {
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
