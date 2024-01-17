import { ApiProperty } from '@nestjs/swagger';
import { OauthClientResponse } from './oauth-client.response';
import { OidcContextResponse } from './oidc-context.response';

export class ConsentResponse {
	constructor(props: ConsentResponse) {
		this.acr = props.acr;
		this.amr = props.amr;
		this.challenge = props.challenge;
		this.client = props.client;
		this.context = props.context;
		this.login_challenge = props.login_challenge;
		this.login_session_id = props.login_session_id;
		this.oidc_context = props.oidc_context;
		this.request_url = props.request_url;
		this.requested_access_token_audience = props.requested_access_token_audience;
		this.requested_scope = props.requested_scope;
		this.skip = props.skip;
		this.subject = props.subject;
	}

	@ApiProperty({
		description:
			'ACR represents the Authentication AuthorizationContext Class Reference value for this authentication session',
	})
	acr: string;

	@ApiProperty({ required: false, nullable: false })
	amr: string[];

	@ApiProperty({
		description:
			'Is the id/authorization challenge of the consent authorization request. It is used to identify the session.',
	})
	challenge: string;

	@ApiProperty()
	client: OauthClientResponse;

	@ApiProperty()
	context: object;

	@ApiProperty({ description: 'LoginChallenge is the login challenge this consent challenge belongs to.' })
	login_challenge: string;

	@ApiProperty({ description: 'LoginSessionID is the login session ID.' })
	login_session_id: string;

	@ApiProperty()
	oidc_context: OidcContextResponse;

	@ApiProperty({
		description: 'RequestUrl is the original OAuth 2.0 Authorization URL requested by the OAuth 2.0 client.',
	})
	request_url: string;

	@ApiProperty({ required: false, nullable: false })
	requested_access_token_audience: string[];

	@ApiProperty({ description: 'The request scopes of the login request.', required: false, nullable: false })
	requested_scope: string[];

	@ApiProperty({
		description: 'Skip, if true, implies that the client has requested the same scopes from the same user previously.',
	})
	skip: boolean;

	@ApiProperty({ description: 'Subject is the user id of the end-user that is authenticated.' })
	subject: string;
}
