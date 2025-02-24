import { OAuthGrantType } from '../types';

export class ClientCredentialsGrantTokenRequest {
	public client_id: string;

	public client_secret: string;

	public scope?: string;

	public grant_type: OAuthGrantType.CLIENT_CREDENTIALS_GRANT;

	constructor(props: ClientCredentialsGrantTokenRequest) {
		this.client_id = props.client_id;
		this.client_secret = props.client_secret;
		this.scope = props.scope;
		this.grant_type = props.grant_type;
	}
}
