import { Loggable, LoggableMessage } from '@shared/common/loggable';

export class ExternalToolLogoFetchedLoggable implements Loggable {
	constructor(private readonly logoUrl: string) {}

	getLogMessage(): LoggableMessage {
		return {
			type: 'EXTERNAL_TOOL_LOGO_FETCHED',
			message: 'External tool logo was fetched',
			data: {
				logoUrl: this.logoUrl,
			},
		};
	}
}
