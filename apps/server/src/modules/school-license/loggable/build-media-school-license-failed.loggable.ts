import { type Loggable, type LoggableMessage } from '@shared/common/loggable';

export class BuildMediaSchoolLicenseFailedLoggable implements Loggable {
	public getLogMessage(): LoggableMessage {
		return {
			message: 'Unable to build media school license, because mediumId is missing.',
		};
	}
}
