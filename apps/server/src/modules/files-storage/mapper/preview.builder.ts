import { PreviewFileOptions } from '@infra/preview-generator';
import { PreviewParams } from '../controller/dto';
import { FileRecord } from '../entity';
import { createPath, createPreviewFilePath, createPreviewNameHash, getFormat } from '../helper';
import { PreviewFileParams } from '../interface';

export class PreviewBuilder {
	public static buildParams(
		fileRecord: FileRecord,
		previewParams: PreviewParams,
		bytesRange: string | undefined
	): PreviewFileParams {
		const { storageLocationId, id, mimeType } = fileRecord;
		const originFilePath = createPath(storageLocationId, id);
		const format = getFormat(previewParams.outputFormat ?? mimeType);

		const hash = createPreviewNameHash(id, previewParams);
		const previewFilePath = createPreviewFilePath(storageLocationId, hash, id);

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
