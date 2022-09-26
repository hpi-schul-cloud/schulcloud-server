import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';
import { OidcContextResponse, OauthClientResponse } from '@src/modules/oauth-provider/controller/dto';

export class ConsentResponse {
	constructor(consentResponse: ConsentResponse) {
		Object.assign(this, consentResponse);
	}

	@IsOptional()
	@ApiProperty({
		description:
			'ACR represents the Authentication AuthorizationContext Class Reference value for this authentication session',
	})
	acr?: string;

	@IsArray()
	@IsOptional()
	@IsString({ each: true })
	@ApiProperty({ required: false, nullable: false })
	amr?: string[];

	@ApiProperty({
		description:
			'Is the id/authorization challenge of the consent authorization request. It is used to identify the session.',
	})
	challenge: string | undefined;

	@IsOptional()
	@ApiProperty()
	client?: OauthClientResponse;

	@IsOptional()
	@ApiProperty()
	context?: object;

	@IsOptional()
	@ApiProperty({ description: 'LoginChallenge is the login challenge this consent challenge belongs to.' })
	login_challenge?: string;

	@IsOptional()
	@ApiProperty({ description: 'LoginSessionID is the login session ID.' })
	login_session_id?: string;

	@IsOptional()
	@ApiProperty()
	oidc_context?: OidcContextResponse;

	@IsOptional()
	@ApiProperty({
		description: 'RequestUrl is the original OAuth 2.0 Authorization URL requested by the OAuth 2.0 client.',
	})
	request_url?: string;

	@IsArray()
	@IsOptional()
	@IsString({ each: true })
	@ApiProperty({ required: false, nullable: false })
	requested_access_token_audience?: string[];

	@IsArray()
	@IsOptional()
	@IsString({ each: true })
	@ApiProperty({ description: 'The request scopes of the login request.', required: false, nullable: false })
	requested_scope?: string[];

	@IsOptional()
	@ApiProperty({
		description: 'Skip, if true, implies that the client has requested the same scopes from the same user previously.',
	})
	skip?: boolean;

	@IsOptional()
	@ApiProperty({ description: 'Subject is the user id of the end-user that is authenticated.' })
	subject?: string;
}
