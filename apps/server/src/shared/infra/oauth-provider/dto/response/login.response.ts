import { ProviderOauthClient } from '../interface/oauth-client.interface';
import { ProviderOidcContext } from '../interface/oidc-context.interface';

export interface LoginResponse {
	challenge: string;

	client: ProviderOauthClient;

	oidc_context?: ProviderOidcContext;

	request_url: string;

	requested_access_token_audience: string[];

	requested_scope: string[];

	session_id?: string;

	skip: boolean;

	subject: string;
}
