import util from 'node:util';
import { fileDomainFactory } from '../../testing';
import { CreateArchiveLoggable } from './create-archive.loggable';

describe('CreateArchiveLoggable', () => {
	it('should serialize Error instances with error.message', () => {
		const files = [fileDomainFactory.build()];
		const error = new Error('archive failed');
		const sut = new CreateArchiveLoggable('message', 'createArchive', files, error);

		const result = sut.getLogMessage();

		expect(result).toEqual({
			message: 'message',
			data: {
				action: 'createArchive',
				fileIds: files[0].id,
				error: 'archive failed',
			},
		});
	});

	it('should serialize non-Error values with util.inspect', () => {
		const files = [fileDomainFactory.build()];
		const unknownError = { reason: 'broken', code: 42 };
		const sut = new CreateArchiveLoggable('message', 'createArchive', files, unknownError);

		const result = sut.getLogMessage();

		expect(result).toEqual({
			message: 'message',
			data: {
				action: 'createArchive',
				fileIds: files[0].id,
				error: util.inspect(unknownError),
			},
		});
	});
});
