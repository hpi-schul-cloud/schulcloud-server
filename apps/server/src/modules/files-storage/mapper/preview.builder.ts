import crypto from 'crypto';
import { PreviewFileOptions } from '@infra/preview-generator';
import { PreviewParams } from '../api/dto';
import { FileRecord } from '../domain';
import { PreviewFileParams } from '../domain/interface';
import { EntityId } from '@shared/domain/types';

export class PreviewBuilder {
	public static buildParams(
		fileRecord: FileRecord,
		previewParams: PreviewParams,
		bytesRange: string | undefined
	): PreviewFileParams {
		const { id, mimeType } = fileRecord;
		const originFilePath = fileRecord.createPath();
		const format = FileRecord.getFormat(previewParams.outputFormat ?? mimeType);

		const hash = PreviewBuilder.createPreviewNameHash(id, previewParams);
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

	public static createPreviewNameHash(fileRecordId: EntityId, previewParams: PreviewParams): string {
		const width = previewParams.width ?? '';
		const format = previewParams.outputFormat ?? '';
		const fileParamsString = `${fileRecordId}${width}${format}`;
		const hash = crypto.createHash('md5').update(fileParamsString).digest('hex');

		return hash;
	}
}
