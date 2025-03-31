import { Loggable, LogMessage } from '@core/logger';

export class CourseSyncHistoryExpirationConfigMissingLoggable implements Loggable {
	public getLogMessage(): LogMessage {
		return {
			message: 'Course synchronization histories could be created because its expiration period config is missing.',
		};
	}
}
