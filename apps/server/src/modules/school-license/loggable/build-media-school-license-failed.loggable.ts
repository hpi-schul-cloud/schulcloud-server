import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';

export class BuildMediaSchoolLicenseFailedLoggable implements Loggable {
	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			message: 'Could not build media school license, because mediumId is missing.',
		};
	}
}
