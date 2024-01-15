import { Factory } from 'fishery';
import { IntrospectResponse } from '../domain/interface';

export const introspectResponseFactory = Factory.define<IntrospectResponse>(() => {
	return {
		active: true,
		aud: [],
		exp: 1,
		ext: {},
		iat: 1,
		iss: '',
		nbf: 1,
		client_id: '',
		sub: '',
		obfuscated_subject: '',
		scope: '',
		token_type: '',
		token_use: '',
		username: '',
	};
});
