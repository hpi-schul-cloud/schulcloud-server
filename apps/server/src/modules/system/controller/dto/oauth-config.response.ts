export class OauthConfigResponse {
	constructor(oauthConfigResponse: OauthConfigResponse) {
		this.clientId = oauthConfigResponse.clientId;
		this.clientSecret = oauthConfigResponse.clientSecret;
		this.tokenRedirectUri = oauthConfigResponse.tokenRedirectUri;
		this.grantType = oauthConfigResponse.grantType;
		this.tokenEndpoint = oauthConfigResponse.tokenEndpoint;
		this.authEndpoint = oauthConfigResponse.authEndpoint;
		this.responseType = oauthConfigResponse.responseType;
		this.scope = oauthConfigResponse.scope;
		this.provider = oauthConfigResponse.provider;
		this.logoutEndpoint = oauthConfigResponse.logoutEndpoint;
		this.issuer = oauthConfigResponse.issuer;
		this.jwksEndpoint = oauthConfigResponse.jwksEndpoint;
		this.codeRedirectUri = oauthConfigResponse.codeRedirectUri;
	}

	clientId!: string;

	clientSecret?: string;

	tokenRedirectUri?: string;

	grantType?: string;

	tokenEndpoint?: string;

	authEndpoint!: string;

	responseType!: string;

	scope!: string;

	provider!: string;

	logoutEndpoint!: string;

	issuer?: string;

	jwksEndpoint?: string;

	codeRedirectUri!: string;
}
