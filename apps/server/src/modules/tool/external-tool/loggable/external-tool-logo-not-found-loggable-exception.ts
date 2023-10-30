import { NotFoundException } from '@nestjs/common';
import { Loggable } from '@src/core/logger/interfaces/loggable';
import { LogMessage, ErrorLogMessage, ValidationErrorLogMessage } from '@src/core/logger/types/logging.types';

export class ExternalToolLogoNotFoundLoggableException extends NotFoundException implements Loggable {
	constructor(private readonly externalToolId: string) {
		super();
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: 'EXTERNAL_TOOL_LOGO_NOT_FOUND',
			message: 'External tool logo not found',
			stack: this.stack,
			data: {
				externalToolId: this.externalToolId,
			},
		};
	}
}
