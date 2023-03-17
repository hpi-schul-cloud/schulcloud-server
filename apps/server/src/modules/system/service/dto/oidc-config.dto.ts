export class OidcConfigDto {
	constructor(oidcConfigDto: OidcConfigDto) {
		this.parentSystemId = oidcConfigDto.parentSystemId;
		this.clientId = oidcConfigDto.clientId;
		this.clientSecret = oidcConfigDto.clientSecret;
		this.alias = oidcConfigDto.alias;
		this.authorizationUrl = oidcConfigDto.authorizationUrl;
		this.tokenUrl = oidcConfigDto.tokenUrl;
		this.userinfoUrl = oidcConfigDto.userinfoUrl;
		this.logoutUrl = oidcConfigDto.logoutUrl;
		this.defaultScopes = oidcConfigDto.defaultScopes;
	}

	parentSystemId: string;

	clientId: string;

	clientSecret: string;

	alias: string;

	authorizationUrl: string;

	tokenUrl: string;

	logoutUrl: string;

	userinfoUrl: string;

	defaultScopes: string;
}
