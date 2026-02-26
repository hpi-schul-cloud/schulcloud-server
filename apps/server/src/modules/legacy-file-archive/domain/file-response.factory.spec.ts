import { ArchiveTestFactory } from '@modules/files-storage/testing/archive.test.factory';
import { Readable } from 'node:stream';
import { FileResponseFactory } from './file-response.factory';

describe('FileResponseFactory', () => {
	describe('create()', () => {
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

			const result = FileResponseFactory.create(file, name);

			expect(result).toEqual(expectedResponse);
		});
	});

	describe('createFromArchive()', () => {
		const setup = (done: (err?: unknown) => void) => {
			const archive = ArchiveTestFactory.build(done);

			return { archive };
		};

		it('should return archive file response', (done) => {
			const { archive } = setup(done);

			const result = FileResponseFactory.createFromArchive('abc', archive);

			archive.on('close', () => {
				expect(result.contentType).toEqual('application/zip');
				done();
			});
		});
	});
});
