export class OAuthTokenDto {
	public idToken: string;

	public refreshToken: string;

	public accessToken: string;

	constructor(props: OAuthTokenDto) {
		this.idToken = props.idToken;
		this.refreshToken = props.refreshToken;
		this.accessToken = props.accessToken;
	}
}
