import { System, ISystemProperties } from '@shared/domain';
import { BaseFactory } from './base.factory';

export const systemFactory = BaseFactory.define<System, ISystemProperties>(System, ({ sequence }) => {
	return {
		type: 'iserv',
		url: 'http://mock.de',
		alias: 'bb',
		oauthconfig: {
			client_id: '12345',
			client_secret: 'mocksecret',
			token_endpoint: 'http://mock.de/mock/auth/public/mockToken',
			grant_type: 'authorization_code',
			token_redirect_uri: 'http://mockhost:3030/api/v3/oauth/testsystemId/token',
			scope: 'openid uuid',
			response_type: 'code',
			auth_endpoint: 'mock_auth_endpoint',
			auth_redirect_uri: '',
		},
	};
});
