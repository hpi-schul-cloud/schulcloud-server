import { type Loggable, type LoggableMessage } from '@shared/common/loggable';
import { type EntityId } from '@shared/domain/types';

export class SchoolIdDoesNotMatchWithUserSchoolId implements Loggable {
	constructor(
		private readonly userMatchSchoolId: string,
		private readonly importUserSchoolId: string,
		private readonly schoolId?: EntityId
	) {}

	public getLogMessage(): LoggableMessage {
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
