import { OAuthGrantType } from '../../interface/oauth-grant-type.enum';

export class AccessTokenRequest {
	client_id: string;

	client_secret: string;

	scope?: string;

	grant_type: OAuthGrantType;

	constructor(props: AccessTokenRequest) {
		this.client_id = props.client_id;
		this.client_secret = props.client_secret;
		this.scope = props.scope;
		this.grant_type = props.grant_type;
	}
}
