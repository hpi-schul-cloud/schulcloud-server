import { BadRequestException } from '@nestjs/common';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';

export class ExternalToolLogoSizeExceededLoggableException extends BadRequestException implements Loggable {
	constructor(
		private readonly externalToolId: string | undefined,
		private readonly maxExternalToolLogoSizeInBytes: number
	) {
		super();
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
