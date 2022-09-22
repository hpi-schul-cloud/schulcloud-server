import { ProviderOauthClient, ProviderOidcContext } from '@shared/infra/oauth-provider/dto';

export class ConsentResponse {
	constructor(consentResponse: ConsentResponse) {
		Object.assign(this, consentResponse);
	}

	acr?: string;

	amr?: string[];

	challenge: string | undefined;

	client?: ProviderOauthClient;

	context?: object;

	login_challenge?: string;

	login_session_id?: string;

	oidc_context?: ProviderOidcContext;

	request_url?: string;

	requested_access_token_audience?: string[];

	requested_scope?: string[];

	skip?: boolean;

	subject?: string;
}
