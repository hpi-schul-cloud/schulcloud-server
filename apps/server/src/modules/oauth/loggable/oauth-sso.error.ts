import { InternalServerErrorException } from '@nestjs/common';
import { SSOErrorCode } from './sso-error-code.enum';

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
