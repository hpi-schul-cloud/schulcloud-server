import { InternalServerErrorException } from '@nestjs/common';
import { Loggable, LoggableMessage } from '@shared/common/loggable';

export class AdminApiSchoolCreateNoIdErrorLoggable extends InternalServerErrorException implements Loggable {
	getLogMessage(): LoggableMessage {
		/* istanbul ignore next */
		return {
			type: 'ADMIN_API_CREATED_SCHOOL_HAS_NO_ID',
			message:
				'A newly created school has been returned without an id. This should never happen, since an id is assigned when an entity is created. Check if created schools are always persisted.',
			stack: this.stack,
		};
	}
}
