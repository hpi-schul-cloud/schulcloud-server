import { OAuthGrantType } from '../../interface/oauth-grant-type.enum';

export class ClientCredentialsGrantTokenRequest {
	client_id: string;

	client_secret: string;

	scope?: string;

	grant_type: OAuthGrantType.CLIENT_CREDENTIALS_GRANT;

	constructor(props: ClientCredentialsGrantTokenRequest) {
		this.client_id = props.client_id;
		this.client_secret = props.client_secret;
		this.scope = props.scope;
		this.grant_type = props.grant_type;
	}
}
