import { OAuthGrantType } from '../types';

export class AuthenticationCodeGrantTokenRequest {
	public client_id: string;

	public client_secret: string;

	public redirect_uri: string;

	public grant_type: OAuthGrantType.AUTHORIZATION_CODE_GRANT;

	public code: string;

	constructor(props: AuthenticationCodeGrantTokenRequest) {
		this.client_id = props.client_id;
		this.client_secret = props.client_secret;
		this.redirect_uri = props.redirect_uri;
		this.grant_type = props.grant_type;
		this.code = props.code;
	}
}
