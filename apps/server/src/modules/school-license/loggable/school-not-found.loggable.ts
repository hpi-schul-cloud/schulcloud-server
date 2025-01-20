import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '../../../core/logger';

export class SchoolNotFoundLoggable implements Loggable {
	constructor(private readonly schoolId: string) {}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			message: 'Unable to sync media school license, because school cannot be found.',
			data: {
				schoolId: this.schoolId,
			},
		};
	}
}
