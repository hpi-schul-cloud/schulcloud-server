import { ApiProperty } from '@nestjs/swagger';

export class OauthConfigResponse {
	@ApiProperty({
		description: 'Client id',
		required: true,
		nullable: false,
	})
	clientId: string;

	@ApiProperty({
		description: 'Redirect uri',
		required: true,
		nullable: false,
	})
	redirectUri: string;

	@ApiProperty({
		description: 'Grant type',
		required: true,
		nullable: false,
	})
	grantType: string;

	@ApiProperty({
		description: 'Token endpoint',
		required: true,
		nullable: false,
	})
	tokenEndpoint: string;

	@ApiProperty({
		description: 'Auth endpoint',
		required: true,
		nullable: false,
	})
	authEndpoint: string;

	@ApiProperty({
		description: 'Response type',
		required: true,
		nullable: false,
	})
	responseType: string;

	@ApiProperty({
		description: 'Scope',
		required: true,
		nullable: false,
	})
	scope: string;

	@ApiProperty({
		description: 'Provider',
		required: true,
		nullable: false,
	})
	provider: string;

	@ApiProperty({
		description: 'Logout endpoint',
		required: true,
		nullable: false,
	})
	logoutEndpoint: string;

	@ApiProperty({
		description: 'Issuer',
		required: true,
		nullable: false,
	})
	issuer: string;

	@ApiProperty({
		description: 'Jwks endpoint',
		required: true,
		nullable: false,
	})
	jwksEndpoint: string;

	constructor(oauthConfigResponse: {
		redirectUri: string;
		tokenEndpoint: string;
		responseType: string;
		clientId: string;
		provider: string;
		jwksEndpoint: string;
		authEndpoint: string;
		scope: string;
		logoutEndpoint: string;
		grantType: string;
		issuer: string;
	}) {
		this.clientId = oauthConfigResponse.clientId;
		this.redirectUri = oauthConfigResponse.redirectUri;
		this.grantType = oauthConfigResponse.grantType;
		this.tokenEndpoint = oauthConfigResponse.tokenEndpoint;
		this.authEndpoint = oauthConfigResponse.authEndpoint;
		this.responseType = oauthConfigResponse.responseType;
		this.scope = oauthConfigResponse.scope;
		this.provider = oauthConfigResponse.provider;
		this.logoutEndpoint = oauthConfigResponse.logoutEndpoint;
		this.issuer = oauthConfigResponse.issuer;
		this.jwksEndpoint = oauthConfigResponse.jwksEndpoint;
	}
}
