import { InternalServerErrorException } from '@nestjs/common';
import { SSOErrorCode } from './sso-error-code.enum';

/**
 * @deprecated Please create a loggable instead.
 * This will be removed with: https://ticketsystem.dbildungscloud.de/browse/N21-1483
 */
export class OAuthSSOError extends InternalServerErrorException {
	readonly message: string;

	readonly errorcode: string;

	readonly DEFAULT_MESSAGE: string = 'Error in SSO Oauth Process.';

	readonly DEFAULT_ERRORCODE: string = SSOErrorCode.SSO_OAUTH_LOGIN_FAILED;

	constructor(message?: string, errorcode?: string) {
		super(message);
		this.message = message || this.DEFAULT_MESSAGE;
		this.errorcode = errorcode || this.DEFAULT_ERRORCODE;
	}
}
