import { SkipFileLoggable } from './skip-file.loggable';

describe('SkipFileLoggable', () => {
	it('should return the correct log message with the file id', () => {
		const fileId = 'file-123';
		const sut = new SkipFileLoggable(fileId);

		const result = sut.getLogMessage();

		expect(result).toEqual({
			message: 'Skipping file due to download error',
			data: { fileId },
		});
	});
});
