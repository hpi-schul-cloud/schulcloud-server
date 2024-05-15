import { fileRecordFactory } from '@shared/testing/factory';
import { PreviewOutputMimeTypes } from '../interface';
import { PreviewBuilder } from './preview.builder';

describe('PreviewBuilder', () => {
	describe('buildParams is called', () => {
		const setup = () => {
			const fileRecord = fileRecordFactory.buildWithId();
			const previewParams = { outputFormat: PreviewOutputMimeTypes.IMAGE_WEBP };
			const bytesRange = 'bytes=0-100';

			const expectedResponse = {
				fileRecord,
				previewParams,
				hash: expect.any(String),
				previewFilePath: expect.any(String),
				originFilePath: expect.any(String),
				format: expect.any(String),
				bytesRange,
			};

			return { fileRecord, previewParams, bytesRange, expectedResponse };
		};

		it('should return preview file params', () => {
			const { fileRecord, previewParams, bytesRange, expectedResponse } = setup();

			const result = PreviewBuilder.buildParams(fileRecord, previewParams, bytesRange);

			expect(result).toEqual(expectedResponse);
		});
	});

	describe('buildPayload is called', () => {
		const setup = () => {
			const fileRecord = fileRecordFactory.buildWithId();
			const previewParams = { outputFormat: PreviewOutputMimeTypes.IMAGE_WEBP };
			const bytesRange = 'bytes=0-100';
			const previewFileParams = PreviewBuilder.buildParams(fileRecord, previewParams, bytesRange);

			const expectedResponse = {
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

			const result = PreviewBuilder.buildPayload(previewFileParams);

			expect(result).toEqual(expectedResponse);
		});
	});
});
