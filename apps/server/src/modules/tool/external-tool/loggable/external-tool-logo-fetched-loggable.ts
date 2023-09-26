import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';

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
