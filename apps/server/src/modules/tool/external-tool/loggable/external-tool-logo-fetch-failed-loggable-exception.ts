import { NotFoundException } from '@nestjs/common';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';

export class ExternalToolLogoFetchFailedLoggableException extends NotFoundException implements Loggable {
	constructor(private readonly logoUrl: string) {
		super();
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: 'EXTERNAL_TOOL_LOGO_FETCH_FAILED',
			message: 'External tool logo could not be fetched',
			stack: this.stack,
			data: {
				logoUrl: this.logoUrl,
			},
		};
	}
}
