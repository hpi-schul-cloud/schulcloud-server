import { OauthClient, OidcContext, ProviderLoginResponse } from '@shared/infra/oauth-provider/dto';
import { ApiProperty } from '@nestjs/swagger';

export class LoginResponse {
	constructor(providerLoginResponse: ProviderLoginResponse) {
		Object.assign(this, providerLoginResponse);
	}

	@ApiProperty()
	client_id?: string;

	@ApiProperty()
	challenge: string | undefined;

	@ApiProperty()
	client: OauthClient | undefined;

	@ApiProperty()
	oidc_context?: OidcContext;

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
