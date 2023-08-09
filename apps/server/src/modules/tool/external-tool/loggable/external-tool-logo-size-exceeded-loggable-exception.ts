import { HttpStatus } from '@nestjs/common';
import { BusinessError } from '@shared/common';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';

export class ExternalToolLogoSizeExceededLoggableException extends BusinessError implements Loggable {
	constructor(
		private readonly externalToolId: string | undefined,
		private readonly maxExternalToolLogoSizeInBytes: number
	) {
		super(
			{
				type: 'EXTERNAL_TOOL_LOGO_SIZE_EXCEEDED',
				title: 'External tool logo size exceeded.',
				defaultMessage: 'External tool logo size exceeded.',
			},
			HttpStatus.BAD_REQUEST
		);
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: 'EXTERNAL_TOOL_LOGO_SIZE_EXCEEDED',
			message: 'External tool logo size exceeded',
			stack: this.stack,
			data: {
				externalToolId: this.externalToolId,
				maxExternalToolLogoSizeInBytes: this.maxExternalToolLogoSizeInBytes,
			},
		};
	}
}
