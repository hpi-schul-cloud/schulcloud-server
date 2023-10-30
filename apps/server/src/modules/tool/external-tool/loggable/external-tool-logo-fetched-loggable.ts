import { Loggable } from '@src/core/logger/interfaces/loggable';
import { LogMessage, ErrorLogMessage, ValidationErrorLogMessage } from '@src/core/logger/types/logging.types';

export class ExternalToolLogoFetchedLoggable implements Loggable {
	constructor(private readonly logoUrl: string) {}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: 'EXTERNAL_TOOL_LOGO_FETCHED',
			message: 'External tool logo was fetched',
			data: {
				logoUrl: this.logoUrl,
			},
		};
	}
}
