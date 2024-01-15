import { Factory } from 'fishery';
import { ProviderConsentSessionResponse } from '../domain';
import { providerConsentResponseFactory } from './provider-consent-response.factory';

export const providerConsentSessionResponseFactory = Factory.define<ProviderConsentSessionResponse>(() => {
	return {
		session: {
			access_token: '',
			id_token: '',
		},
		consent_request: providerConsentResponseFactory.build(),
		grant_access_token_audience: [],
		grant_scope: ['offline', 'openid'],
		handled_at: '',
		remember: false,
		remember_for: 1,
	};
});
