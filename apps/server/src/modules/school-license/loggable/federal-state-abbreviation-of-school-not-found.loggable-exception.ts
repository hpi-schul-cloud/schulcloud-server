import { NotFoundException } from '@nestjs/common';
import { ErrorLogMessage, LogMessage, ValidationErrorLogMessage } from '@core/logger';

export class FederalStateAbbreviationOfSchoolNotFoundLoggableException extends NotFoundException {
	constructor(private readonly schoolId: string) {
		super();
	}

	public getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			message:
				'Unable to fetch media school licenses from media source, because federal state abbreviation of school cannot be found.',
			data: {
				schoolId: this.schoolId,
			},
		};
	}
}
