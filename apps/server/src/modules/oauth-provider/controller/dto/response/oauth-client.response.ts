import { ApiProperty } from '@nestjs/swagger';

export class OauthClientResponse {
	constructor(oauthClientResponse: OauthClientResponse) {
		Object.assign(this, oauthClientResponse);
	}

	@ApiProperty()
	allowed_cors_origins?: string[];

	@ApiProperty()
	audience?: string[];

	@ApiProperty()
	authorization_code_grant_access_token_lifespan?: string;

	@ApiProperty()
	authorization_code_grant_id_token_lifespan?: string;

	@ApiProperty()
	authorization_code_grant_refresh_token_lifespan?: string;

	@ApiProperty()
	backchannel_logout_session_required?: boolean;

	@ApiProperty()
	backchannel_logout_uri?: string;

	@ApiProperty()
	client_credentials_grant_access_token_lifespan?: string;

	@ApiProperty()
	client_id?: string;

	@ApiProperty()
	client_name?: string;

	@ApiProperty()
	client_secret_expires_at?: number;

	@ApiProperty()
	client_uri?: string;

	@ApiProperty()
	contacts?: string[];

	@ApiProperty()
	created_at?: string;

	@ApiProperty()
	frontchannel_logout_session_required?: boolean;

	@ApiProperty()
	frontchannel_logout_uri?: string;

	@ApiProperty()
	grant_types?: string[];

	@ApiProperty()
	implicit_grant_access_token_lifespan?: string;

	@ApiProperty()
	implicit_grant_id_token_lifespan?: string;

	@ApiProperty()
	jwks?: object;

	@ApiProperty()
	jwks_uri?: string;

	@ApiProperty()
	jwt_bearer_grant_access_token_lifespan?: string;

	@ApiProperty()
	logo_uri?: string;

	@ApiProperty()
	metadata?: object;

	@ApiProperty()
	owner?: string;

	@ApiProperty()
	password_grant_access_token_lifespan?: string;

	@ApiProperty()
	password_grant_refresh_token_lifespan?: string;

	@ApiProperty()
	policy_uri?: string;

	@ApiProperty()
	post_logout_redirect_uris?: string[];

	@ApiProperty()
	redirect_uris?: string[];

	@ApiProperty()
	refresh_token_grant_access_token_lifespan?: string;

	@ApiProperty()
	refresh_token_grant_id_token_lifespan?: string;

	@ApiProperty()
	refresh_token_grant_refresh_token_lifespan?: string;

	@ApiProperty()
	registration_access_token?: string;

	@ApiProperty()
	registration_client_uri?: string;

	@ApiProperty()
	request_object_signing_alg?: string;

	@ApiProperty()
	request_uris?: string[];

	@ApiProperty()
	response_types?: string[];

	@ApiProperty()
	scope?: string;

	@ApiProperty()
	sector_identifier_uri?: string;

	@ApiProperty()
	subject_type?: string;

	@ApiProperty()
	token_endpoint_auth_method?: string;

	@ApiProperty()
	token_endpoint_auth_signing_alg?: string;

	@ApiProperty()
	tos_uri?: string;

	@ApiProperty()
	updated_at?: string;

	@ApiProperty()
	userinfo_signed_response_alg?: string;
}
