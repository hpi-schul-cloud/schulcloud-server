import { HttpStatus } from '@nestjs/common';
import { CommonCartridgeImportErrorEnum } from './error.enums';
import { FileSizeExceededLoggableException } from './file-size-exceeded.loggable-exception';

describe('FileSizeExceededLoggableException', () => {
	describe('constructor', () => {
		it('should create an exception with correct properties', () => {
			const fileSize = 2000000000;
			const maxFileSize = 1073741824;

			const exception = new FileSizeExceededLoggableException(fileSize, maxFileSize);

			expect(exception.code).toBe(HttpStatus.PAYLOAD_TOO_LARGE);
			expect(exception.type).toBe(CommonCartridgeImportErrorEnum.FILE_SIZE_EXCEEDED);
			expect(exception.title).toBe('File Size Exceeded');
			expect(exception.message).toContain(fileSize.toString());
			expect(exception.message).toContain(maxFileSize.toString());
			expect(exception.details).toEqual({ fileSize, maxFileSize });
		});
	});

	describe('getLogMessage', () => {
		it('should return a log message with all required fields', () => {
			const fileSize = 2000000000;
			const maxFileSize = 1073741824;

			const exception = new FileSizeExceededLoggableException(fileSize, maxFileSize);
			const logMessage = exception.getLogMessage();

			expect(logMessage.type).toBe(CommonCartridgeImportErrorEnum.FILE_SIZE_EXCEEDED);
			expect(logMessage.stack).toBeDefined();
			expect(logMessage.data).toEqual({
				fileSize,
				maxFileSize,
				message: `File size ${fileSize} bytes exceeds maximum allowed size ${maxFileSize} bytes`,
			});
		});
	});
});
