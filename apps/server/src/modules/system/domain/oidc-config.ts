export class OidcConfig {
	clientId: string;

	clientSecret: string;

	idpHint: string;

	authorizationUrl: string;

	tokenUrl: string;

	logoutUrl: string;

	userinfoUrl: string;

	defaultScopes: string;

	constructor(oauthConfigDto: OidcConfig) {
		this.clientId = oauthConfigDto.clientId;
		this.clientSecret = oauthConfigDto.clientSecret;
		this.idpHint = oauthConfigDto.idpHint;
		this.authorizationUrl = oauthConfigDto.authorizationUrl;
		this.tokenUrl = oauthConfigDto.tokenUrl;
		this.logoutUrl = oauthConfigDto.logoutUrl;
		this.userinfoUrl = oauthConfigDto.userinfoUrl;
		this.defaultScopes = oauthConfigDto.defaultScopes;
	}
}
