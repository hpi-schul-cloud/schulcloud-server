import { PassThrough } from 'stream';
import { PreviewGeneratorBuilder } from './preview-generator.builder';

describe('PreviewGeneratorBuilder', () => {
	describe('buildFile is called', () => {
		const setup = () => {
			const preview = new PassThrough();
			const previewOptions = {
				format: 'webp',
			};

			const expectedResponse = {
				data: preview,
				mimeType: previewOptions.format,
			};

			return { preview, previewOptions, expectedResponse };
		};

		it('should return preview file', () => {
			const { preview, previewOptions, expectedResponse } = setup();

			const result = PreviewGeneratorBuilder.buildFile(preview, previewOptions);

			expect(result).toEqual(expectedResponse);
		});
	});
});
