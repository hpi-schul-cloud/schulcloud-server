import { Loggable, LoggableMessage } from '@shared/common/loggable';

export class SchulconnexConfigurationMissingLoggable implements Loggable {
	getLogMessage(): LoggableMessage {
		return {
			message: `SchulconnexRestClient: Missing configuration. Please check your environment variables in SCHULCONNEX_CLIENT.`,
		};
	}
}
