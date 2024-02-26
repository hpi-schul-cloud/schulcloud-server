import { HttpStatus } from '@nestjs/common';
import { BusinessError } from '@shared/common';
import { EntityId } from '@shared/domain/types';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';

export class UserNotFoundAfterProvisioningLoggableException extends BusinessError implements Loggable {
	constructor(
		private readonly externalUserId: string,
		private readonly systemId: EntityId,
		private readonly officialSchoolNumber?: string
	) {
		super(
			{
				type: 'USER_NOT_FOUND_AFTER_PROVISIONING',
				title: 'User not found after provisioning',
				defaultMessage:
					'Unable to find user after provisioning. The feature for OAuth2 provisioning might be disabled for this school.',
			},
			HttpStatus.INTERNAL_SERVER_ERROR
		);
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: this.type,
			message: this.message,
			stack: this.stack,
			data: {
				externalUserId: this.externalUserId,
				systemId: this.systemId,
				officialSchoolNumber: this.officialSchoolNumber,
			},
		};
	}
}
