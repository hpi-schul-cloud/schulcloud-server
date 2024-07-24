import { ProviderOauthClient } from '../oauth-client.interface';
import { ProviderOidcContext } from '../oidc-context.interface';

/**
 * @see https://www.ory.sh/docs/hydra/reference/api#tag/oAuth2
 */
export interface ProviderConsentResponse {
	acr: string;

	amr: string[];

	challenge: string;

	client: ProviderOauthClient;

	context: object;

	login_challenge: string;

	login_session_id: string;

	oidc_context: ProviderOidcContext;

	request_url: string;

	requested_access_token_audience: string[];

	requested_scope: string[];

	skip: boolean;

	subject: string;
}
