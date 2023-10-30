import { EntityId } from '@shared/domain/types/entity-id';
import { Loggable } from '@src/core/logger/interfaces/loggable';
import { ErrorLogMessage, LogMessage, ValidationErrorLogMessage } from '@src/core/logger/types/logging.types';

export class SchoolIdDoesNotMatchWithUserSchoolId implements Loggable {
	constructor(
		private readonly userMatchSchoolId: string,
		private readonly importUserSchoolId: string,
		private readonly schoolId?: EntityId
	) {}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			message: 'School ID does not match with user school ID or with imported user school ID',
			data: {
				userMatchSchoolId: this.userMatchSchoolId,
				importUserId: this.importUserSchoolId,
				schoolId: this.schoolId,
			},
		};
	}
}
