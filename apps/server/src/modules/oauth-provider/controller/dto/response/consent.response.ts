import { ApiProperty } from '@nestjs/swagger';
import { OauthClientResponse } from '@src/modules/oauth-provider/controller/dto/response/oauth-client.response';
import { OidcContextResponse } from '@src/modules/oauth-provider/controller/dto/response/oidc-context.response';

export class ConsentResponse {
	constructor(consentResponse: ConsentResponse) {
		Object.assign(this, consentResponse);
	}

	@ApiProperty()
	acr?: string;

	@ApiProperty()
	amr?: string[];

	@ApiProperty()
	challenge: string | undefined;

	@ApiProperty()
	client?: OauthClientResponse;

	@ApiProperty()
	context?: object;

	@ApiProperty()
	login_challenge?: string;

	@ApiProperty()
	login_session_id?: string;

	@ApiProperty()
	oidc_context?: OidcContextResponse;

	@ApiProperty()
	request_url?: string;

	@ApiProperty()
	requested_access_token_audience?: string[];

	@ApiProperty()
	requested_scope?: string[];

	@ApiProperty()
	skip?: boolean;

	@ApiProperty()
	subject?: string;
}
