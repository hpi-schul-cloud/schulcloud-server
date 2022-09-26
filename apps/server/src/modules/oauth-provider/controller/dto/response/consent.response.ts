import { ApiProperty } from '@nestjs/swagger';
import { OauthClientResponse } from '@src/modules/oauth-provider/controller/dto/response/oauth-client.response';
import { OidcContextResponse } from '@src/modules/oauth-provider/controller/dto/response/oidc-context.response';
import { IsOptional } from 'class-validator';

export class ConsentResponse {
	constructor(consentResponse: ConsentResponse) {
		Object.assign(this, consentResponse);
	}

	@IsOptional()
	@ApiProperty()
	acr?: string;

	@IsOptional()
	@ApiProperty()
	amr?: string[];

	@ApiProperty()
	challenge: string | undefined;

	@IsOptional()
	@ApiProperty()
	client?: OauthClientResponse;

	@IsOptional()
	@ApiProperty()
	context?: object;

	@IsOptional()
	@ApiProperty()
	login_challenge?: string;

	@IsOptional()
	@ApiProperty()
	login_session_id?: string;

	@IsOptional()
	@ApiProperty()
	oidc_context?: OidcContextResponse;

	@IsOptional()
	@ApiProperty()
	request_url?: string;

	@IsOptional()
	@ApiProperty()
	requested_access_token_audience?: string[];

	@IsOptional()
	@ApiProperty()
	requested_scope?: string[];

	@IsOptional()
	@ApiProperty()
	skip?: boolean;

	@IsOptional()
	@ApiProperty()
	subject?: string;
}
