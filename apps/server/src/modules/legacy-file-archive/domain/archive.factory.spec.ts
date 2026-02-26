import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Logger } from '@infra/logger';
import { PassThrough } from 'stream';
import { FileRecord } from '../file-record.do';
import { FileStorageActionsLoggable } from '../loggable';
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
		const fileRecords: FileRecord[] = [];

		const archive = ArchiveFactory.create(files, fileRecords, logger, 'zip');

		const chunks: Buffer[] = [];
		archive.on('data', (chunk) => chunks.push(chunk));
		archive.on('close', () => {
			expect(Buffer.concat(chunks).length).toBeGreaterThan(0);
			expect(logger.debug).toHaveBeenCalled();
			done();
		});
		archive.on('error', (err) => done(err));
	});

	it('should call logger.warning on ENOENT warning', () => {
		const files = [createFileResponse('file.txt', 'test')];
		const fileRecords: FileRecord[] = [];

		const archive = ArchiveFactory.create(files, fileRecords, logger, 'zip');

		const warning = { code: 'ENOENT' };
		archive.emit('warning', warning);

		expect(logger.warning).toHaveBeenCalledWith(expect.any(FileStorageActionsLoggable));
	});

	it('should throw an Error on non-ENOENT warning', () => {
		const files = [createFileResponse('file.txt', 'test')];
		const fileRecords: FileRecord[] = [];

		const archive = ArchiveFactory.create(files, fileRecords, logger, 'zip');

		expect(() => {
			archive.emit('warning', { code: 'OTHER', message: 'Some error' });
		}).toThrow('Error while creating archive on warning event');
	});

	it('should throw on error event', () => {
		const files = [createFileResponse('file.txt', 'test')];
		const fileRecords: FileRecord[] = [];

		const archive = ArchiveFactory.create(files, fileRecords, logger, 'zip');

		expect(() => {
			archive.emit('error', new Error('archive error'));
		}).toThrow('Error while creating archive');
	});
});
