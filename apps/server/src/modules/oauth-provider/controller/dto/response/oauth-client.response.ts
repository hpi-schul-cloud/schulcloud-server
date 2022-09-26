import { ApiProperty } from '@nestjs/swagger';
import { Optional } from '@nestjs/common';

export class OauthClientResponse {
	constructor(oauthClientResponse: OauthClientResponse) {
		Object.assign(this, oauthClientResponse);
	}

	@Optional()
	@ApiProperty()
	allowed_cors_origins?: string[];

	@Optional()
	@ApiProperty()
	audience?: string[];

	@Optional()
	@ApiProperty()
	authorization_code_grant_access_token_lifespan?: string;

	@Optional()
	@ApiProperty()
	authorization_code_grant_id_token_lifespan?: string;

	@Optional()
	@ApiProperty()
	authorization_code_grant_refresh_token_lifespan?: string;

	@Optional()
	@ApiProperty()
	backchannel_logout_session_required?: boolean;

	@Optional()
	@ApiProperty()
	backchannel_logout_uri?: string;

	@Optional()
	@ApiProperty()
	client_credentials_grant_access_token_lifespan?: string;

	@Optional()
	@ApiProperty()
	client_id?: string;

	@Optional()
	@ApiProperty()
	client_name?: string;

	@Optional()
	@ApiProperty()
	client_secret_expires_at?: number;

	@Optional()
	@ApiProperty()
	client_uri?: string;

	@Optional()
	@ApiProperty()
	contacts?: string[];

	@Optional()
	@ApiProperty()
	created_at?: string;

	@Optional()
	@ApiProperty()
	frontchannel_logout_session_required?: boolean;

	@Optional()
	@ApiProperty()
	frontchannel_logout_uri?: string;

	@Optional()
	@ApiProperty()
	grant_types?: string[];

	@Optional()
	@ApiProperty()
	implicit_grant_access_token_lifespan?: string;

	@Optional()
	@ApiProperty()
	implicit_grant_id_token_lifespan?: string;

	@Optional()
	@ApiProperty()
	jwks?: object;

	@Optional()
	@ApiProperty()
	jwks_uri?: string;

	@Optional()
	@ApiProperty()
	jwt_bearer_grant_access_token_lifespan?: string;

	@Optional()
	@ApiProperty()
	logo_uri?: string;

	@Optional()
	@ApiProperty()
	metadata?: object;

	@Optional()
	@ApiProperty()
	owner?: string;

	@Optional()
	@ApiProperty()
	password_grant_access_token_lifespan?: string;

	@Optional()
	@ApiProperty()
	password_grant_refresh_token_lifespan?: string;

	@Optional()
	@ApiProperty()
	policy_uri?: string;

	@Optional()
	@ApiProperty()
	post_logout_redirect_uris?: string[];

	@Optional()
	@ApiProperty()
	redirect_uris?: string[];

	@Optional()
	@ApiProperty()
	refresh_token_grant_access_token_lifespan?: string;

	@Optional()
	@ApiProperty()
	refresh_token_grant_id_token_lifespan?: string;

	@Optional()
	@ApiProperty()
	refresh_token_grant_refresh_token_lifespan?: string;

	@Optional()
	@ApiProperty()
	registration_access_token?: string;

	@Optional()
	@ApiProperty()
	registration_client_uri?: string;

	@Optional()
	@ApiProperty()
	request_object_signing_alg?: string;

	@Optional()
	@ApiProperty()
	request_uris?: string[];

	@Optional()
	@ApiProperty()
	response_types?: string[];

	@Optional()
	@ApiProperty()
	scope?: string;

	@Optional()
	@ApiProperty()
	sector_identifier_uri?: string;

	@Optional()
	@ApiProperty()
	subject_type?: string;

	@Optional()
	@ApiProperty()
	token_endpoint_auth_method?: string;

	@Optional()
	@ApiProperty()
	token_endpoint_auth_signing_alg?: string;

	@Optional()
	@ApiProperty()
	tos_uri?: string;

	@Optional()
	@ApiProperty()
	updated_at?: string;

	@Optional()
	@ApiProperty()
	userinfo_signed_response_alg?: string;
}
