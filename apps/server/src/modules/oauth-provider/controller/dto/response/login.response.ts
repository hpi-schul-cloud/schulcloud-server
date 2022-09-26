import { ApiProperty } from '@nestjs/swagger';
import { OauthClientResponse } from '@src/modules/oauth-provider/controller/dto/response/oauth-client.response';
import { OidcContextResponse } from '@src/modules/oauth-provider/controller/dto/response/oidc-context.response';
import { IsOptional } from 'class-validator';

export class LoginResponse {
	constructor(loginResponse: LoginResponse) {
		Object.assign(this, loginResponse);
	}

	@IsOptional()
	@ApiProperty({ description: 'Id of the corresponding client.' })
	client_id?: string;

	@ApiProperty({ description: 'The id/challenge of the consent login request.' })
	challenge: string | undefined;

	@ApiProperty()
	client: OauthClientResponse | undefined;

	@IsOptional()
	@ApiProperty()
	oidc_context?: OidcContextResponse;

	@IsOptional()
	@ApiProperty({ description: 'The original oauth2.0 authorization url request by the client.' })
	request_url?: string;

	@IsOptional()
	@ApiProperty()
	requested_access_token_audience?: string[];

	@IsOptional()
	@ApiProperty()
	requested_scope?: string[];

	@IsOptional()
	@ApiProperty({
		description: 'The login session id. This parameter is used as sid for the oidc front-/backchannel logout.',
	})
	session_id?: string;

	@ApiProperty({
		description: 'Skip, if true, implies that the client has requested the same scopes from the same user previously.',
	})
	skip: boolean | undefined;

	@ApiProperty({ description: 'User id of the end-user that is authenticated.' })
	subject: string | undefined;
}
