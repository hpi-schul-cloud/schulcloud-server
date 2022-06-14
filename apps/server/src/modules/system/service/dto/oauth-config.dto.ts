export class OauthConfigDto {

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
