export class OauthConfigDto {
	constructor(oauthConfigDto: OauthConfigDto) {
		this.clientId = oauthConfigDto.clientId;
		this.clientSecret = oauthConfigDto.clientSecret;
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
	}

	clientId: string;

	clientSecret: string;

	redirectUri: string;

	grantType: string;

	tokenEndpoint: string;

	authEndpoint: string;

	responseType: string;

	scope: string;

	provider: string;

	logoutEndpoint: string;

	issuer: string;

	jwksEndpoint: string;
}
