import { ApiProperty } from '@nestjs/swagger';
import { OauthClientResponse } from '@src/modules/oauth-provider/controller/dto/response/oauth-client.response';
import { OidcContextResponse } from '@src/modules/oauth-provider/controller/dto/response/oidc-context.response';

export class LoginResponse {
	constructor(loginResponse: LoginResponse) {
		Object.assign(this, loginResponse);
	}

	@ApiProperty()
	client_id?: string;

	@ApiProperty()
	challenge: string | undefined;

	@ApiProperty()
	client: OauthClientResponse | undefined;

	@ApiProperty()
	oidc_context?: OidcContextResponse;

	@ApiProperty()
	request_url?: string;

	@ApiProperty()
	requested_access_token_audience?: string[];

	@ApiProperty()
	requested_scope?: string[];

	@ApiProperty()
	session_id?: string;

	@ApiProperty()
	skip: boolean | undefined;

	@ApiProperty()
	subject: string | undefined;
}
