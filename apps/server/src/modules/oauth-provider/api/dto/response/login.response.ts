import { ApiProperty } from '@nestjs/swagger';
import { OauthClientResponse } from './oauth-client.response';
import { OidcContextResponse } from './oidc-context.response';

export class LoginResponse {
	constructor(props: LoginResponse) {
		this.client = props.client;
		this.client_id = props.client_id;
		this.challenge = props.challenge;
		this.oidc_context = new OidcContextResponse(props.oidc_context);
		this.request_url = props.request_url;
		this.skip = props.skip;
		this.requested_access_token_audience = props.requested_access_token_audience;
		this.requested_scope = props.requested_scope;
		this.subject = props.subject;
		this.session_id = props.session_id;
	}

	@ApiProperty({ description: 'Id of the corresponding client.' })
	client_id: string;

	@ApiProperty({ description: 'The id/challenge of the consent login request.' })
	challenge: string;

	@ApiProperty()
	client: OauthClientResponse;

	@ApiProperty()
	oidc_context: OidcContextResponse;

	@ApiProperty({ description: 'The original oauth2.0 authorization url request by the client.' })
	request_url: string;

	@ApiProperty()
	requested_access_token_audience: string[];

	@ApiProperty({ description: 'The request scopes of the login request.', required: false, nullable: false })
	requested_scope: string[];

	@ApiProperty({
		description: 'The login session id. This parameter is used as sid for the oidc front-/backchannel logout.',
	})
	session_id: string;

	@ApiProperty({
		description: 'Skip, if true, implies that the client has requested the same scopes from the same user previously.',
	})
	skip: boolean;

	@ApiProperty({ description: 'User id of the end-user that is authenticated.' })
	subject: string;
}
