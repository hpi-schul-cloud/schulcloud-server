import { EntityId } from '@shared/domain/types';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';
import { OauthSsoErrorLoggableException } from './oauth-sso-error-loggable-exception';

export class UserNotFoundAfterProvisioningLoggableException extends OauthSsoErrorLoggableException implements Loggable {
	constructor(
		private readonly externalUserId: string,
		private readonly systemId: EntityId,
		private readonly officialSchoolNumber?: string
	) {
		super(
			'Unable to find user after provisioning. The feature for OAuth2 provisioning might be disabled for this school.',
			'sso_user_not_found_after_provisioning'
		);
	}

	override getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
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
