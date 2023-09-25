export interface OauthConfig {
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
	logoutEndpoint: string;
	issuer: string;
	jwksEndpoint: string;
}
