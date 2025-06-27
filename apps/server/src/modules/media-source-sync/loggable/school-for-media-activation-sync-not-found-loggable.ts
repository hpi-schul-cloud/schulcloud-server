import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@core/logger';

export class SchoolForMediaActivationSyncNotFoundLoggable implements Loggable {
	constructor(private readonly officialSchoolNumber: string) {}

	public getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			message: 'Unable to sync media activations because school could not be found.',
			data: {
				officialSchoolNumber: this.officialSchoolNumber,
			},
		};
	}
}
