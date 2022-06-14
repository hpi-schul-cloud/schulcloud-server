export class OauthConfigDto {
	constructor(oauthConfigDto: OauthConfigDto) {
		this.clientId = oauthConfigDto.clientId;
		this.clientSecret = oauthConfigDto.clientSecret;
		this.tokenRedirectUri = oauthConfigDto.tokenRedirectUri;
		this.grantType = oauthConfigDto.grantType;
		this.tokenEndpoint = oauthConfigDto.tokenEndpoint;
		this.authEndpoint = oauthConfigDto.authEndpoint;
		this.responseType = oauthConfigDto.responseType;
		this.scope = oauthConfigDto.scope;
		this.provider = oauthConfigDto.provider;
		this.logoutEndpoint = oauthConfigDto.logoutEndpoint;
		this.issuer = oauthConfigDto.issuer;
		this.jwksEndpoint = oauthConfigDto.jwksEndpoint;
		this.codeRedirectUri = oauthConfigDto.codeRedirectUri;
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
