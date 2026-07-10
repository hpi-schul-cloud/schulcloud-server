import { UnprocessableEntityException } from '@nestjs/common';
import { type Loggable, type LoggableMessage } from '@shared/common/loggable';

export class ExternalSchoolNumberMissingLoggableException extends UnprocessableEntityException implements Loggable {
	constructor(private readonly externalSchoolId: string) {
		super();
	}

	public getLogMessage(): LoggableMessage {
		return {
			type: 'EXTERNAL_SCHOOL_NUMBER_MISSING',
			message: 'The external system did not provide a official school number for the school.',
			stack: this.stack,
			data: {
				externalSchoolId: this.externalSchoolId,
			},
		};
	}
}
