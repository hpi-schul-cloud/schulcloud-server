import { Factory } from 'fishery';
import { ProviderOidcContext } from '../domain/interface';

export const providerOidcContextFactory = Factory.define<ProviderOidcContext>(() => {
	return {
		acr_values: [],
		display: '',
		id_token_hint_claims: {},
		login_hint: '',
		ui_locales: [],
	};
});
