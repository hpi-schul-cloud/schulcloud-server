import { BadRequestException } from '@nestjs/common';
import { Loggable, LoggableMessage } from '@shared/common/loggable';

export class UserImportSchoolExternalIdMissingLoggableException extends BadRequestException implements Loggable {
	constructor(private readonly schoolId: string) {
		super();
	}

	getLogMessage(): LoggableMessage {
		return {
			type: 'USER_IMPORT_SCHOOL_EXTERNAL_ID_MISSING',
			message: 'The users school does not have an external id',
			stack: this.stack,
			data: {
				schoolId: this.schoolId,
			},
		};
	}
}
