import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';

export class EtherpadConfigurationMissingLoggable implements Loggable {
	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			message: `EtherpadRestClient: Missing configuration. Please check your environment variables for Etherpad`,
		};
	}
}
