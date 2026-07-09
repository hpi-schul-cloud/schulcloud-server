export class OidcConfig {
	public clientId: string;

	public clientSecret: string;

	public idpHint: string;

	public authorizationUrl: string;

	public tokenUrl: string;

	public logoutUrl: string;

	public userinfoUrl: string;

	public defaultScopes: string;

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
