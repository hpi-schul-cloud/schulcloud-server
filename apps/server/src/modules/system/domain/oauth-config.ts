export class OauthConfig {
	public clientId: string;

	public clientSecret: string;

	public idpHint?: string;

	public redirectUri: string;

	public grantType: string;

	public tokenEndpoint: string;

	public authEndpoint: string;

	public responseType: string;

	public scope: string;

	public provider: string;

	/**
	 * If this is set it will be used to redirect the user after login to the logout endpoint of the identity provider.
	 */
	public logoutEndpoint?: string;

	public issuer: string;

	public jwksEndpoint: string;

	public endSessionEndpoint?: string;

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
