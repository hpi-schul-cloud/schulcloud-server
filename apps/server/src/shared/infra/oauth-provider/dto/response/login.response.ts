import { OauthClient } from '../interface/oauth-client.interface';
import { OidcContext } from '../interface/oidc-context.interface';

export interface ProviderLoginResponse {
	challenge: string;

	client: OauthClient;

	oidc_context?: OidcContext;

	request_url: string;

	requested_access_token_audience: string[];

	requested_scope: string[];

	session_id?: string;

	skip: boolean;

	subject: string;
}
