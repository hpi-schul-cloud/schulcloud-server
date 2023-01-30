export class TokenRequestPayload {
	tokenEndpoint: string;

	client_id: string;

	client_secret: string;

	redirect_uri: string;

	grant_type: string;

	code: string;

	constructor(props: TokenRequestPayload) {
		this.tokenEndpoint = props.tokenEndpoint;
		this.client_id = props.client_id;
		this.client_secret = props.client_secret;
		this.redirect_uri = props.redirect_uri;
		this.grant_type = props.grant_type;
		this.code = props.code;
	}
}
