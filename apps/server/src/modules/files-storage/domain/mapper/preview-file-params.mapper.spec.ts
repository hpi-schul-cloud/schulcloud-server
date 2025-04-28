import { PreviewFileOptions } from '@infra/preview-generator';
import { PreviewFileParams, PreviewOutputMimeTypes } from '../../domain';
import { fileRecordTestFactory } from '../../testing';
import { PreviewFileOptionsMapper } from './preview-file-params.mapper';

describe('PreviewFileOptionsMapper', () => {
	describe('fromPreviewFileParams is called', () => {
		const setup = () => {
			const fileRecord = fileRecordTestFactory().build();
			const previewParams = { outputFormat: PreviewOutputMimeTypes.IMAGE_WEBP };
			const previewFileParams: PreviewFileParams = {
				fileRecord,
				previewParams,
				hash: 'hash',
				originFilePath: 'originFilePath',
				previewFilePath: 'previewFilePath',
				format: PreviewOutputMimeTypes.IMAGE_WEBP,
				bytesRange: 'bytes=0-100',
			};

			const expectedResponse: PreviewFileOptions = {
				originFilePath: previewFileParams.originFilePath,
				previewFilePath: previewFileParams.previewFilePath,
				previewOptions: {
					format: previewFileParams.format,
					width: previewFileParams.previewParams.width,
				},
			};

			return { previewFileParams, expectedResponse };
		};

		it('should return preview payload', () => {
			const { previewFileParams, expectedResponse } = setup();

			const result = PreviewFileOptionsMapper.fromPreviewFileParams(previewFileParams);

			expect(result).toEqual(expectedResponse);
		});
	});
});
