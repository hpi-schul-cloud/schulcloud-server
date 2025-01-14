export class OauthConfig {
	clientId: string;

	clientSecret: string;

	idpHint?: string;

	redirectUri: string;

	grantType: string;

	tokenEndpoint: string;

	authEndpoint: string;

	responseType: string;

	scope: string;

	provider: string;

	/**
	 * If this is set it will be used to redirect the user after login to the logout endpoint of the identity provider.
	 */
	logoutEndpoint?: string;

	issuer: string;

	jwksEndpoint: string;

	endSessionEndpoint?: string;

	constructor(oauthConfigDto: OauthConfig) {
		this.clientId = oauthConfigDto.clientId;
		this.clientSecret = oauthConfigDto.clientSecret;
		this.idpHint = oauthConfigDto.idpHint;
		this.redirectUri = oauthConfigDto.redirectUri;
		this.grantType = oauthConfigDto.grantType;
		this.tokenEndpoint = oauthConfigDto.tokenEndpoint;
		this.authEndpoint = oauthConfigDto.authEndpoint;
		this.responseType = oauthConfigDto.responseType;
		this.scope = oauthConfigDto.scope;
		this.provider = oauthConfigDto.provider;
		this.logoutEndpoint = oauthConfigDto.logoutEndpoint;
		this.issuer = oauthConfigDto.issuer;
		this.jwksEndpoint = oauthConfigDto.jwksEndpoint;
		this.endSessionEndpoint = oauthConfigDto.endSessionEndpoint;
	}
}
