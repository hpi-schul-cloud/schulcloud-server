import { Factory } from 'fishery';
import { AcceptConsentRequestBody } from '../domain/interface';
import { idTokenFactory } from './id-token.factory';

export const acceptConsentRequestBodyFactory = Factory.define<AcceptConsentRequestBody>(() => {
	return {
		grant_access_token_audience: [],
		grant_scope: ['offline', 'openid'],
		handled_at: '',
		remember: true,
		session: {
			access_token: '',
			id_token: idTokenFactory.build(),
		},
		remember_for: 0,
	};
});
