import { Logger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { PassThrough } from 'node:stream';
import { FileDo } from '../do';
import { ArchiveFactory } from './archive.factory';

describe('ArchiveFactory', () => {
	let logger: DeepMocked<Logger>;

	beforeEach(() => {
		logger = createMock<Logger>();
	});

	const createFileResponse = (name: string, content: string) => {
		const stream = new PassThrough();
		stream.end(content);

		return { name, data: stream };
	};

	it('should create a zip archive and append files', (done) => {
		const files = [createFileResponse('file1.txt', 'hello'), createFileResponse('file2.txt', 'world')];
		const fileEntities: FileDo[] = [];

		const archive = ArchiveFactory.create(files, fileEntities, logger, 'zip');

		const chunks: Buffer[] = [];
		archive.on('data', (chunk) => chunks.push(chunk));
		archive.on('close', () => {
			expect(Buffer.concat(chunks).length).toBeGreaterThan(0);
			done();
		});
		// eslint-disable-next-line @typescript-eslint/no-unsafe-return
		archive.on('error', (err) => done(err));
	});

	it('should log warning on ENOENT warning', () => {
		const files = [createFileResponse('file.txt', 'test')];
		const fileRecords: FileDo[] = [];

		const archive = ArchiveFactory.create(files, fileRecords, logger, 'zip');

		archive.emit('warning', { code: 'ENOENT', message: 'File not found' });

		expect(logger.warning).toHaveBeenCalledTimes(1);
	});

	it('should log warning on non-ENOENT warning', () => {
		const files = [createFileResponse('file.txt', 'test')];
		const fileRecords: FileDo[] = [];

		const archive = ArchiveFactory.create(files, fileRecords, logger, 'zip');

		archive.emit('warning', { code: 'OTHER', message: 'Some error' });

		expect(logger.warning).toHaveBeenCalledTimes(1);
	});

	it('should log on error event', () => {
		const files = [createFileResponse('file.txt', 'test')];
		const fileRecords: FileDo[] = [];

		const archive = ArchiveFactory.create(files, fileRecords, logger, 'zip');

		archive.emit('error', new Error('archive error'));

		expect(logger.warning).toHaveBeenCalledTimes(1);
	});
});
