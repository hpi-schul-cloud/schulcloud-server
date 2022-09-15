import { OauthClient } from '../interface/oauth-client.interface';
import { OidcContext } from '../interface/oidc-context.interface';

export interface ConsentResponse {
	acr?: string;

	amr?: string[];

	challenge: string;

	client?: OauthClient;

	context?: object;

	login_challenge?: string;

	login_session_id?: string;

	oidc_context?: OidcContext;

	request_url?: string;

	requested_access_token_audience?: string[];

	requested_scope?: string[];

	skip?: boolean;

	subject?: string;
}
