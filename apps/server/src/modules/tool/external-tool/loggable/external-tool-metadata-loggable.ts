import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';

export class ExternalToolMetadataLoggable implements Loggable {
	constructor(private readonly msg: string) {}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: 'EXTERNAL_TOOL_METADATA',
			message: 'No related tools found, return empty external tool metadata',
			data: {
				msg: this.msg,
			},
		};
	}
}
