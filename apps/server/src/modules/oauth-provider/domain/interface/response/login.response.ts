import { ProviderOauthClient } from '../oauth-client.interface';
import { ProviderOidcContext } from '../oidc-context.interface';

/**
 * @see https://www.ory.sh/docs/hydra/reference/api#tag/oAuth2
 */
export interface ProviderLoginResponse {
	challenge: string;

	client: ProviderOauthClient;

	oidc_context: ProviderOidcContext;

	request_url: string;

	requested_access_token_audience: string[];

	requested_scope: string[];

	session_id: string;

	skip: boolean;

	subject: string;
}
