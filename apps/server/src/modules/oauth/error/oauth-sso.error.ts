import { SSOErrorCode } from './sso-error-code.enum';

export class OAuthSSOError extends Error {
	readonly message: string;

	readonly errorcode: string;

	readonly provider?: string;

	readonly errorRedirect?: string;

	readonly DEFAULT_MESSAGE: string = 'Error in SSO Oauth Process.';

	readonly DEFAULT_ERRORCODE: string = SSOErrorCode.SSO_OAUTH_LOGIN_FAILED;

	constructor(message?: string, errorcode?: string, provider?: string, errorRedirect?: string) {
		super(message);
		this.message = message || this.DEFAULT_MESSAGE;
		this.errorcode = errorcode || this.DEFAULT_ERRORCODE;
		this.provider = provider;
		this.errorRedirect = errorRedirect;
	}
}
