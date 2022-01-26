export class OAuthResponse {
	constructor({ jwt, error, redirectUri }: OAuthResponse) {
		this.jwt = jwt;
		this.error = error;
		this.redirectUri = redirectUri;
	}

	jwt?: string;

	error?: string;

	redirectUri: string;
}
