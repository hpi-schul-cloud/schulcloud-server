import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';

export class SchoolForSchoolMediaLicenseSyncNotFoundLoggable implements Loggable {
	constructor(private readonly officialSchoolNumber: string) {}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			message: 'Unable to sync media school license, because school cannot be found.',
			data: {
				officialSchoolNumber: this.officialSchoolNumber,
			},
		};
	}
}
