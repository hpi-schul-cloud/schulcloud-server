import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@infra/logger';

export class SchulconnexConfigurationMissingLoggable implements Loggable {
	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			message: `SchulconnexRestClient: Missing configuration. Please check your environment variables in SCHULCONNEX_CLIENT.`,
		};
	}
}
