import { ApiProperty } from '@nestjs/swagger';
import { Optional } from '@nestjs/common';
import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { SubjectTypeEnum } from '@src/modules/oauth-provider/interface/subject-type.enum';

export class OauthClientResponse {
	constructor(oauthClientResponse: OauthClientResponse) {
		Object.assign(this, oauthClientResponse);
	}

	@IsArray()
	@IsOptional()
	@IsString({ each: true })
	@ApiProperty({ required: false, nullable: false })
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
	@ApiProperty({ description: 'Boolean value specifying whether the RP requires that a sid (session ID) Claim.' })
	backchannel_logout_session_required?: boolean;

	@Optional()
	@ApiProperty({ description: 'RP URL that will cause the RP to log itself out when sent a Logout Token by the OP.' })
	backchannel_logout_uri?: string;

	@Optional()
	@ApiProperty()
	client_credentials_grant_access_token_lifespan?: string;

	@Optional()
	@ApiProperty({ description: 'Id of the client.' })
	client_id?: string;

	@Optional()
	@ApiProperty({ description: 'Human-readable string name of the client presented to the end-user.' })
	client_name?: string;

	@Optional()
	@ApiProperty({
		description:
			'SecretExpiresAt is an integer holding the time at which the client secret will expire or 0 if it will not expire.',
	})
	client_secret_expires_at?: number;

	@Optional()
	@ApiProperty({ description: 'ClientUri is an URL string of a web page providing information about the client.' })
	client_uri?: string;

	@IsArray()
	@IsOptional()
	@IsString({ each: true })
	@ApiProperty({ required: false, nullable: false })
	contacts?: string[];

	@Optional()
	@ApiProperty({ description: 'CreatedAt returns the timestamp of the clients creation.' })
	created_at?: string;

	@Optional()
	@ApiProperty({
		description:
			'Boolean value specifying whether the RP requires that iss (issuer) and sid (session ID) query parameters.',
	})
	frontchannel_logout_session_required?: boolean;

	@Optional()
	@ApiProperty({ description: 'RP URL that will cause the RP to log itself out when rendered in an iframe by the OP.' })
	frontchannel_logout_uri?: string;

	@IsArray()
	@IsOptional()
	@IsString({ each: true })
	@ApiProperty({ description: 'The grant types of the Oauth2 client.', required: false, nullable: false })
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
	@ApiProperty({ description: 'URL for the clients JSON Web Key Set [JWK] document' })
	jwks_uri?: string;

	@Optional()
	@ApiProperty()
	jwt_bearer_grant_access_token_lifespan?: string;

	@Optional()
	@ApiProperty({ description: 'LogoUri is an URL string that references a logo for the client.' })
	logo_uri?: string;

	@Optional()
	@ApiProperty()
	metadata?: object;

	@Optional()
	@ApiProperty({ description: 'Owner is a string identifying the owner of the OAuth 2.0 Client.' })
	owner?: string;

	@Optional()
	@ApiProperty()
	password_grant_access_token_lifespan?: string;

	@Optional()
	@ApiProperty()
	password_grant_refresh_token_lifespan?: string;

	@Optional()
	@ApiProperty({ description: 'PolicyUri is a URL string that points to a human-readable privacy policy document' })
	policy_uri?: string;

	@IsArray()
	@IsOptional()
	@IsString({ each: true })
	@ApiProperty({ required: false, nullable: false })
	post_logout_redirect_uris?: string[];

	@IsArray()
	@IsOptional()
	@IsString({ each: true })
	@ApiProperty({ required: false, nullable: false })
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
	@ApiProperty({ description: 'RegistrationAccessToken can be used to update, get, or delete the OAuth2 Client.' })
	registration_access_token?: string;

	@Optional()
	@ApiProperty({ description: 'RegistrationClientURI is the URL used to update, get, or delete the OAuth2 Client.' })
	registration_client_uri?: string;

	@Optional()
	@ApiProperty({
		description: 'JWS [JWS] alg algorithm [JWA] that MUST be used for signing Request Objects sent to the OP.',
	})
	request_object_signing_alg?: string;

	@IsArray()
	@IsOptional()
	@IsString({ each: true })
	@ApiProperty({ required: false, nullable: false })
	request_uris?: string[];

	@IsArray()
	@IsOptional()
	@IsString({ each: true })
	@ApiProperty({ description: 'The response types of the Oauth2 client.', required: false, nullable: false })
	response_types?: string[];

	@Optional()
	@ApiProperty({
		description:
			'Scope is a string containing a space-separated list of scope values (as described in Section 3.3 of OAuth 2.0 [RFC6749]) that the client can use when requesting access tokens.',
	})
	scope?: string;

	@Optional()
	@ApiProperty({
		description: 'URL using the https scheme to be used in calculating Pseudonymous Identifiers by the OP.',
	})
	sector_identifier_uri?: string;

	@Optional()
	@IsEnum(SubjectTypeEnum)
	@ApiProperty({
		description:
			'SubjectType requested for responses to this Client. The subject_types_supported Discovery parameter contains a list of the supported subject_type values for this server. Valid types include pairwise and public.',
	})
	subject_type?: SubjectTypeEnum;

	@Optional()
	@ApiProperty()
	token_endpoint_auth_method?: string;

	@Optional()
	@ApiProperty()
	token_endpoint_auth_signing_alg?: string;

	@Optional()
	@ApiProperty({
		description:
			'TermsOfServiceUri is a URL string that points to a human-readable terms of service document for the client.',
	})
	tos_uri?: string;

	@Optional()
	@ApiProperty({ description: 'UpdatedAt returns the timestamp of the last update.' })
	updated_at?: string;

	@Optional()
	@ApiProperty({ description: 'JWS alg algorithm [JWA] REQUIRED for signing UserInfo Responses. ' })
	userinfo_signed_response_alg?: string;
}
