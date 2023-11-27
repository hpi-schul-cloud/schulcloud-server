export class OAuthTokenDto {
	idToken: string;

	refreshToken: string;

	accessToken: string;

	constructor(props: OAuthTokenDto) {
		this.idToken = props.idToken;
		this.refreshToken = props.refreshToken;
		this.accessToken = props.accessToken;
	}
}
