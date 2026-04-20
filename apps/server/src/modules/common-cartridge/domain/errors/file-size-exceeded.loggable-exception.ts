import { ErrorLogMessage, Loggable } from '@core/logger';
import { HttpStatus } from '@nestjs/common';
import { BusinessError } from '@shared/common/error';
import { CommonCartridgeImportErrorEnum } from './error.enums';

export class FileSizeExceededLoggableException extends BusinessError implements Loggable {
	constructor(private readonly fileSize: number, private readonly maxFileSize: number) {
		super(
			{
				type: CommonCartridgeImportErrorEnum.FILE_SIZE_EXCEEDED,
				title: 'File Size Exceeded',
				defaultMessage: `The file size (${fileSize} bytes) exceeds the maximum allowed size (${maxFileSize} bytes).`,
			},
			HttpStatus.PAYLOAD_TOO_LARGE,
			{
				fileSize,
				maxFileSize,
			}
		);
	}

	public getLogMessage(): ErrorLogMessage {
		return {
			type: CommonCartridgeImportErrorEnum.FILE_SIZE_EXCEEDED,
			stack: this.stack,
			data: {
				fileSize: this.fileSize,
				maxFileSize: this.maxFileSize,
				message: `File size ${this.fileSize} bytes exceeds maximum allowed size ${this.maxFileSize} bytes`,
			},
		};
	}
}
