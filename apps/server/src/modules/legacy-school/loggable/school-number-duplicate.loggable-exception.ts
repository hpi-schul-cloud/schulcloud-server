import { UnprocessableEntityException } from '@nestjs/common';
import { type Loggable, type LoggableMessage } from '@shared/common/loggable';

export class SchoolNumberDuplicateLoggableException extends UnprocessableEntityException implements Loggable {
	constructor(private readonly officialSchoolNumber: string) {
		super();
	}

	public getLogMessage(): LoggableMessage {
		return {
			type: 'SCHOOL_NUMBER_DUPLICATE',
			message: 'Unable to save the school. A school with this official school number does already exist.',
			stack: this.stack,
			data: {
				officialSchoolNumber: this.officialSchoolNumber,
			},
		};
	}
}
