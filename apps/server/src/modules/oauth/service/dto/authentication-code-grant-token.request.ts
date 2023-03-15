import { OAuthGrantType } from '../../interface/oauth-grant-type.enum';

export class AuthenticationCodeGrantTokenRequest {
	client_id: string;

	client_secret: string;

	redirect_uri: string;

	grant_type: OAuthGrantType.AUTHORIZATION_CODE_GRANT;

	code: string;

	constructor(props: AuthenticationCodeGrantTokenRequest) {
		this.client_id = props.client_id;
		this.client_secret = props.client_secret;
		this.redirect_uri = props.redirect_uri;
		this.grant_type = props.grant_type;
		this.code = props.code;
	}
}
