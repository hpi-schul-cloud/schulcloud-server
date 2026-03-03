import { StreamableFile } from '@nestjs/common';
import { GetFileResponseTestFactory } from '../../testing';
import { StreamableFileMapper } from './stream.response.mapper';

describe('FilesStorageMapper', () => {
	describe('mapToStreamableFile', () => {
		describe('when file is not a PDF', () => {
			const setup = () => {
				const fileResponse = GetFileResponseTestFactory.build({
					name: 'test.txt',
					mimeType: 'text/plain',
				});

				return { fileResponse };
			};

			it('should return StreamableFile with attachment disposition', () => {
				const { fileResponse } = setup();

				const result = StreamableFileMapper.fromResponse(fileResponse);

				expect(result).toBeInstanceOf(StreamableFile);

				const options = result.options;
				expect(options.type).toBe('text/plain');
				expect(options.length).toBe(8);
				expect(options.disposition).toContain('attachment;');
				expect(options.disposition).toContain('filename="test.txt"');
				expect(options.disposition).toContain("filename*=UTF-8''test.txt");
			});
		});

		describe('when file has special characters in name', () => {
			const setup = () => {
				const fileResponse = GetFileResponseTestFactory.build({
					name: 'ü bär.pdf',
					mimeType: 'application/pdf',
				});

				return { fileResponse };
			};

			it('should encode special characters in filename', () => {
				const { fileResponse } = setup();

				const result = StreamableFileMapper.fromResponse(fileResponse);

				const options = result.options;
				const encoded = encodeURIComponent('ü bär.pdf');
				expect(options.disposition).toContain(`filename="${encoded}"`);
				expect(options.disposition).toContain(`filename*=UTF-8''${encoded}`);
			});
		});
	});
});
