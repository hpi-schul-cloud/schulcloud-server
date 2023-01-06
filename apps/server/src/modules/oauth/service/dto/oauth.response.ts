import { ApiProperty } from '@nestjs/swagger';

export class OAuthResponse {
	@ApiProperty()
	jwt?: string;

	@ApiProperty()
	errorCode?: string;

	@ApiProperty()
	idToken?: string;

	@ApiProperty()
	logoutEndpoint?: string;

	@ApiProperty()
	provider: string;

	@ApiProperty()
	redirect?: string;

	constructor(response: OAuthResponse) {
		this.jwt = response.jwt;
		this.errorCode = response.errorCode;
		this.idToken = response.idToken;
		this.logoutEndpoint = response.logoutEndpoint;
		this.provider = response.provider;
		this.redirect = response.redirect;
	}
}
