import { EntityId } from '@shared/domain';
import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';
import { OAuthSSOError } from './oauth-sso.error';

export class UserNotFoundAfterProvisioningLoggableException extends OAuthSSOError implements Loggable {
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

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
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
