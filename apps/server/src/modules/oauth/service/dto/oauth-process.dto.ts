export class OAuthProcessDto {
	jwt?: string;

	redirect: string;

	constructor(response: OAuthProcessDto) {
		this.jwt = response.jwt;
		this.redirect = response.redirect;
	}
}
