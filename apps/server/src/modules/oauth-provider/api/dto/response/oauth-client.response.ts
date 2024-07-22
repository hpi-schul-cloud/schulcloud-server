import { ApiProperty } from '@nestjs/swagger';

export class OauthClientResponse {
	constructor(props: OauthClientResponse) {
		this.allowed_cors_origins = props.allowed_cors_origins;
		this.audience = props.audience;
		this.authorization_code_grant_access_token_lifespan = props.authorization_code_grant_access_token_lifespan;
		this.authorization_code_grant_id_token_lifespan = props.authorization_code_grant_id_token_lifespan;
		this.authorization_code_grant_refresh_token_lifespan = props.authorization_code_grant_refresh_token_lifespan;
		this.backchannel_logout_session_required = props.backchannel_logout_session_required;
		this.backchannel_logout_uri = props.backchannel_logout_uri;
		this.client_credentials_grant_access_token_lifespan = props.client_credentials_grant_access_token_lifespan;
		this.client_id = props.client_id;
		this.client_name = props.client_name;
		this.client_secret_expires_at = props.client_secret_expires_at;
		this.client_uri = props.client_uri;
		this.contacts = props.contacts;
		this.created_at = props.created_at;
		this.frontchannel_logout_session_required = props.frontchannel_logout_session_required;
		this.frontchannel_logout_uri = props.frontchannel_logout_uri;
		this.grant_types = props.grant_types;
		this.implicit_grant_access_token_lifespan = props.implicit_grant_access_token_lifespan;
		this.implicit_grant_id_token_lifespan = props.implicit_grant_id_token_lifespan;
		this.jwks = props.jwks;
		this.jwks_uri = props.jwks_uri;
		this.jwt_bearer_grant_access_token_lifespan = props.jwt_bearer_grant_access_token_lifespan;
		this.logo_uri = props.logo_uri;
		this.metadata = props.metadata;
		this.owner = props.owner;
		this.password_grant_access_token_lifespan = props.password_grant_access_token_lifespan;
		this.password_grant_refresh_token_lifespan = props.password_grant_refresh_token_lifespan;
		this.policy_uri = props.policy_uri;
		this.post_logout_redirect_uris = props.post_logout_redirect_uris;
		this.redirect_uris = props.redirect_uris;
		this.refresh_token_grant_access_token_lifespan = props.refresh_token_grant_access_token_lifespan;
		this.refresh_token_grant_id_token_lifespan = props.refresh_token_grant_id_token_lifespan;
		this.refresh_token_grant_refresh_token_lifespan = props.refresh_token_grant_refresh_token_lifespan;
		this.registration_access_token = props.registration_access_token;
		this.registration_client_uri = props.registration_client_uri;
		this.request_object_signing_alg = props.request_object_signing_alg;
		this.request_uris = props.request_uris;
		this.response_types = props.response_types;
		this.scope = props.scope;
		this.sector_identifier_uri = props.sector_identifier_uri;
		this.subject_type = props.subject_type;
		this.token_endpoint_auth_method = props.token_endpoint_auth_method;
		this.token_endpoint_auth_signing_alg = props.token_endpoint_auth_signing_alg;
		this.tos_uri = props.tos_uri;
		this.updated_at = props.updated_at;
		this.userinfo_signed_response_alg = props.userinfo_signed_response_alg;
	}

	@ApiProperty({ required: false, nullable: false })
	allowed_cors_origins: string[];

	@ApiProperty()
	audience: string[];

	@ApiProperty()
	authorization_code_grant_access_token_lifespan: string;

	@ApiProperty()
	authorization_code_grant_id_token_lifespan: string;

	@ApiProperty()
	authorization_code_grant_refresh_token_lifespan: string;

	@ApiProperty({ description: 'Boolean value specifying whether the RP requires that a sid (session ID) Claim.' })
	backchannel_logout_session_required: boolean;

	@ApiProperty({ description: 'RP URL that will cause the RP to log itself out when sent a Logout Token by the OP.' })
	backchannel_logout_uri: string;

	@ApiProperty()
	client_credentials_grant_access_token_lifespan: string;

	@ApiProperty({ description: 'Id of the client.' })
	client_id: string;

	@ApiProperty({ description: 'Human-readable string name of the client presented to the end-user.' })
	client_name: string;

	@ApiProperty({
		description:
			'SecretExpiresAt is an integer holding the time at which the client secret will expire or 0 if it will not expire.',
	})
	client_secret_expires_at: number;

	@ApiProperty({ description: 'ClientUri is an URL string of a web page providing information about the client.' })
	client_uri: string;

	@ApiProperty({ required: false, nullable: false })
	contacts: string[];

	@ApiProperty({ description: 'CreatedAt returns the timestamp of the clients creation.' })
	created_at: string;

	@ApiProperty({
		description:
			'Boolean value specifying whether the RP requires that iss (issuer) and sid (session ID) query parameters.',
	})
	frontchannel_logout_session_required: boolean;

	@ApiProperty({ description: 'RP URL that will cause the RP to log itself out when rendered in an iframe by the OP.' })
	frontchannel_logout_uri: string;

	@ApiProperty({ description: 'The grant types of the Oauth2 client.', required: false, nullable: false })
	grant_types: string[];

	@ApiProperty()
	implicit_grant_access_token_lifespan: string;

	@ApiProperty()
	implicit_grant_id_token_lifespan: string;

	@ApiProperty()
	jwks: object;

	@ApiProperty({ description: 'URL for the clients JSON Web Key Set [JWK] document' })
	jwks_uri: string;

	@ApiProperty()
	jwt_bearer_grant_access_token_lifespan: string;

	@ApiProperty({ description: 'LogoUri is an URL string that references a logo for the client.' })
	logo_uri: string;

	@ApiProperty()
	metadata: object;

	@ApiProperty({ description: 'Owner is a string identifying the owner of the OAuth 2.0 Client.' })
	owner: string;

	@ApiProperty()
	password_grant_access_token_lifespan: string;

	@ApiProperty()
	password_grant_refresh_token_lifespan: string;

	@ApiProperty({ description: 'PolicyUri is a URL string that points to a human-readable privacy policy document' })
	policy_uri: string;

	@ApiProperty({ required: false, nullable: false })
	post_logout_redirect_uris: string[];

	@ApiProperty({ required: false, nullable: false })
	redirect_uris: string[];

	@ApiProperty()
	refresh_token_grant_access_token_lifespan: string;

	@ApiProperty()
	refresh_token_grant_id_token_lifespan: string;

	@ApiProperty()
	refresh_token_grant_refresh_token_lifespan: string;

	@ApiProperty({ description: 'RegistrationAccessToken can be used to update, get, or delete the OAuth2 Client.' })
	registration_access_token: string;

	@ApiProperty({ description: 'RegistrationClientURI is the URL used to update, get, or delete the OAuth2 Client.' })
	registration_client_uri: string;

	@ApiProperty({
		description: 'JWS [JWS] alg algorithm [JWA] that MUST be used for signing Request Objects sent to the OP.',
	})
	request_object_signing_alg: string;

	@ApiProperty({ required: false, nullable: false })
	request_uris: string[];

	@ApiProperty({ description: 'The response types of the Oauth2 client.', required: false, nullable: false })
	response_types: string[];

	@ApiProperty({
		description:
			'Scope is a string containing a space-separated list of scope values (as described in Section 3.3 of OAuth 2.0 [RFC6749]) that the client can use when requesting access tokens.',
	})
	scope: string;

	@ApiProperty({
		description: 'URL using the https scheme to be used in calculating Pseudonymous Identifiers by the OP.',
	})
	sector_identifier_uri: string;

	@ApiProperty({
		description:
			'SubjectType requested for responses to this Client. The subject_types_supported Discovery parameter contains a list of the supported subject_type values for this server. Valid types include pairwise and public.',
	})
	subject_type: string;

	@ApiProperty()
	token_endpoint_auth_method: string;

	@ApiProperty()
	token_endpoint_auth_signing_alg: string;

	@ApiProperty({
		description:
			'TermsOfServiceUri is a URL string that points to a human-readable terms of service document for the client.',
	})
	tos_uri: string;

	@ApiProperty({ description: 'UpdatedAt returns the timestamp of the last update.' })
	updated_at: string;

	@ApiProperty({ description: 'JWS alg algorithm [JWA] REQUIRED for signing UserInfo Responses. ' })
	userinfo_signed_response_alg: string;
}
