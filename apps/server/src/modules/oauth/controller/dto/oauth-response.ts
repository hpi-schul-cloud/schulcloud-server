export class OAuthResponse {
	constructor({ jwt, errorcode }: OAuthResponse) {
		this.jwt = jwt;
		this.errorcode = errorcode;
	}

	jwt?: string;

	errorcode?: string;
}
