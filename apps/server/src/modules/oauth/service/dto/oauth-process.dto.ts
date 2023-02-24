export class OAuthProcessDto {
	jwt?: string;

	errorCode?: string;

	idToken?: string;

	logoutEndpoint?: string;

	provider?: string;

	redirect?: string;

	constructor(response: OAuthProcessDto) {
		this.jwt = response.jwt;
		this.errorCode = response.errorCode;
		this.idToken = response.idToken;
		this.logoutEndpoint = response.logoutEndpoint;
		this.provider = response.provider;
		this.redirect = response.redirect;
	}
}
