export class OidcConfigDto {
	constructor(configDto: OidcConfigDto) {
		this.clientId = configDto.clientId;
		this.clientSecret = configDto.clientSecret;
		this.authorizationUrl = configDto.authorizationUrl;
		this.tokenUrl = configDto.tokenUrl;
		this.logoutUrl = configDto.logoutUrl;
		this.userinfoUrl = configDto.userinfoUrl;
		this.defaultScopes = configDto.defaultScopes;
	}

	clientId: string;

	clientSecret: string;

	authorizationUrl: string;

	tokenUrl: string;

	logoutUrl?: string;

	userinfoUrl?: string;

	defaultScopes?: string;
}
