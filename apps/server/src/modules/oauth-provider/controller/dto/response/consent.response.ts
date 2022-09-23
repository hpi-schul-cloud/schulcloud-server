import { ProviderOauthClient, ProviderOidcContext } from '@shared/infra/oauth-provider/dto';
import { ApiProperty } from '@nestjs/swagger';

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
	client?: ProviderOauthClient;

	@ApiProperty()
	context?: object;

	@ApiProperty()
	login_challenge?: string;

	@ApiProperty()
	login_session_id?: string;

	@ApiProperty()
	oidc_context?: ProviderOidcContext;

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
