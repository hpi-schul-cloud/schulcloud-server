import { Readable } from 'stream';
import { FileResponseBuilder } from './file-response.builder';

describe('File Response Builder', () => {
	describe('build is called', () => {
		const setup = () => {
			const text = 'testText';
			const readable = Readable.from(text);
			const name = 'testName';
			const file = {
				data: readable,
				contentType: 'text/plain',
				contentLength: text.length,
				contentRange: 'range',
				etag: 'testTag',
			};
			const expectedResponse = { ...file, name };

			return { file, name, expectedResponse };
		};

		it('should return copy file response', () => {
			const { file, name, expectedResponse } = setup();

			const result = FileResponseBuilder.build(file, name);

			expect(result).toEqual(expectedResponse);
		});
	});
});
