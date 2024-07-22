import { Factory } from 'fishery';
import { ProviderLoginResponse } from '../domain/interface';
import { providerOauthClientFactory } from './provider-oauth-client.factory';
import { providerOidcContextFactory } from './provider-oidc-context.factory';

export const providerLoginResponseFactory = Factory.define<ProviderLoginResponse>(() => {
	return {
		challenge: 'challenge',
		client: providerOauthClientFactory.build(),
		oidc_context: providerOidcContextFactory.build(),
		request_url: 'request_url',
		requested_access_token_audience: ['requested_access_token_audience'],
		requested_scope: ['requested_scope'],
		session_id: 'session_id',
		skip: true,
		subject: 'subject',
	};
});
