import { Factory } from 'fishery';
import { ProviderConsentResponse } from '../domain/interface';
import { providerOauthClientFactory } from './provider-oauth-client.factory';
import { providerOidcContextFactory } from './provider-oidc-context.factory';

export const providerConsentResponseFactory = Factory.define<ProviderConsentResponse>(() => {
	return {
		acr: '',
		amr: [],
		challenge: '',
		client: providerOauthClientFactory.build(),
		context: {},
		login_challenge: '',
		login_session_id: '',
		oidc_context: providerOidcContextFactory.build(),
		request_url: '',
		skip: false,
		subject: '',
		requested_scope: ['offline', 'openid'],
		requested_access_token_audience: [],
	};
});
