export class OAuthResponse {
	constructor({ jwt, redirectUri }: OAuthResponse) {
		this.jwt = jwt;
		this.redirectUri = redirectUri;
	}

	jwt?: string;

	redirectUri: string;
}
