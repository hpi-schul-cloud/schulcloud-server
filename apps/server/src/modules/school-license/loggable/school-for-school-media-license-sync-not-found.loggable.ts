import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';

export class SchoolForSchoolMediaLicenseSyncNotFoundLoggable implements Loggable {
	constructor(private readonly schoolNumber: string) {}

	// TODO: test and think if this should be in school module
	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			message: 'Unable to sync media school license, because school cannot be found.',
			data: {
				schoolNumber: this.schoolNumber,
			},
		};
	}
}
