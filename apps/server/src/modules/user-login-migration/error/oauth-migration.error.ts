import { OAuthSSOError } from '@src/modules/oauth/error/oauth-sso.error';

export class OAuthMigrationError extends OAuthSSOError {
	readonly message: string;

	readonly errorcode: string;

	readonly DEFAULT_MESSAGE: string = 'Error in Oauth Migration Process.';

	readonly DEFAULT_ERRORCODE: string = 'OauthMigrationFailed';

	readonly officialSchoolNumberFromSource?: string;

	readonly officialSchoolNumberFromTarget?: string;

	constructor(
		message?: string,
		errorcode?: string,
		officialSchoolNumberFromSource?: string,
		officialSchoolNumberFromTarget?: string
	) {
		super(message);
		this.message = message || this.DEFAULT_MESSAGE;
		this.errorcode = errorcode || this.DEFAULT_ERRORCODE;
		this.officialSchoolNumberFromSource = officialSchoolNumberFromSource;
		this.officialSchoolNumberFromTarget = officialSchoolNumberFromTarget;
	}
}
