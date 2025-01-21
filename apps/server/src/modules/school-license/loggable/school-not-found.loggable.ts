import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';

export class SchoolNotFoundLoggable implements Loggable {
	constructor(private readonly schoolId: string) {}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			message: 'Unable to fetch media school license, because school cannot be found.',
			data: {
				schoolId: this.schoolId,
			},
		};
	}
}
