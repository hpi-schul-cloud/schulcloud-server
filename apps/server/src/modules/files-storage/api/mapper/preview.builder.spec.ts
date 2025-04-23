import { ObjectId } from 'bson';
import crypto from 'crypto';
import { PreviewOutputMimeTypes } from '../../domain';
import { fileRecordTestFactory } from '../../testing';
import { PreviewBuilder } from './preview.builder';

describe('PreviewBuilder', () => {
	describe('buildParams is called', () => {
		const setup = () => {
			const fileRecord = fileRecordTestFactory().build();
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

	describe('createPreviewNameHash is called', () => {
		describe('when preview params are set', () => {
			it('should return hash', () => {
				const fileRecordId = new ObjectId().toHexString();
				const width = 100;
				const outputFormat = PreviewOutputMimeTypes.IMAGE_WEBP;
				const previewParams = {
					width,
					outputFormat,
				};
				const fileParamsString = `${fileRecordId}${width}${outputFormat}`;
				const hash = crypto.createHash('md5').update(fileParamsString).digest('hex');

				const result = PreviewBuilder.createPreviewNameHash(fileRecordId, previewParams);

				expect(result).toBe(hash);
			});
		});

		describe('when preview params are not set', () => {
			it('should return hash', () => {
				const fileRecordId = new ObjectId().toHexString();
				const fileParamsString = `${fileRecordId}${PreviewOutputMimeTypes.IMAGE_WEBP}`;
				const hash = crypto.createHash('md5').update(fileParamsString).digest('hex');

				const result = PreviewBuilder.createPreviewNameHash(fileRecordId, {
					outputFormat: PreviewOutputMimeTypes.IMAGE_WEBP,
				});

				expect(result).toBe(hash);
			});
		});
	});
});
