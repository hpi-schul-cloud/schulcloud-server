import { ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';
import { OAuthSSOError } from './oauth-sso.error';

export class UserNotFoundInUnprovisionedSchoolLoggableException extends OAuthSSOError implements Loggable {
	constructor(private readonly externalUserId: string, private readonly systemId: string) {
		super(undefined, 'sso_user_notfound_in_unprovisioned_school');
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		return {
			type: 'USER_NOT_FOUND_IN_UNPROVISIONED_SCHOOL',
			message: 'The user could not be found because the school was not provisioned.',
			stack: this.stack,
			data: {
				externalUserId: this.externalUserId,
				systemId: this.systemId,
			},
		};
	}
}
