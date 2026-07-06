import { Loggable, LoggableMessage } from '@shared/common/loggable';

export class BuildMediaSchoolLicenseFailedLoggable implements Loggable {
	getLogMessage(): LoggableMessage {
		return {
			message: 'Unable to build media school license, because mediumId is missing.',
		};
	}
}
