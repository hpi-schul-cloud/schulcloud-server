export interface OidcConfig {
	clientId: string;
	clientSecret: string;
	idpHint: string;
	authorizationUrl: string;
	tokenUrl: string;
	logoutUrl: string;
	userinfoUrl: string;
	defaultScopes: string;
}
