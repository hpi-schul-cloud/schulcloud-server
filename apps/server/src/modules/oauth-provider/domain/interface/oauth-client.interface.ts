/**
 * @see https://www.ory.sh/docs/hydra/reference/api#tag/oAuth2
 */
export interface ProviderOauthClient {
	allowed_cors_origins: string[];

	audience: string[];

	authorization_code_grant_access_token_lifespan: string;

	authorization_code_grant_id_token_lifespan: string;

	authorization_code_grant_refresh_token_lifespan: string;

	backchannel_logout_session_required: boolean;

	backchannel_logout_uri: string;

	client_credentials_grant_access_token_lifespan: string;

	client_id: string;

	client_name: string;

	client_secret?: string;

	client_secret_expires_at: number;

	client_uri: string;

	contacts: string[];

	created_at: string;

	frontchannel_logout_session_required: boolean;

	frontchannel_logout_uri: string;

	grant_types: string[];

	implicit_grant_access_token_lifespan: string;

	implicit_grant_id_token_lifespan: string;

	jwks: object;

	jwks_uri: string;

	jwt_bearer_grant_access_token_lifespan: string;

	logo_uri: string;

	metadata: object;

	owner: string;

	password_grant_access_token_lifespan: string;

	password_grant_refresh_token_lifespan: string;

	policy_uri: string;

	post_logout_redirect_uris: string[];

	redirect_uris: string[];

	refresh_token_grant_access_token_lifespan: string;

	refresh_token_grant_id_token_lifespan: string;

	refresh_token_grant_refresh_token_lifespan: string;

	registration_access_token: string;

	registration_client_uri: string;

	request_object_signing_alg: string;

	request_uris: string[];

	response_types: string[];

	scope: string;

	sector_identifier_uri: string;

	subject_type: string;

	token_endpoint_auth_method: string;

	token_endpoint_auth_signing_alg: string;

	tos_uri: string;

	updated_at: string;

	userinfo_signed_response_alg: string;
}
