import { ISystemProperties, System } from '@shared/domain';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { BaseFactory } from './base.factory';

export const systemFactory = BaseFactory.define<System, ISystemProperties>(System, ({ sequence }) => {
	return {
		type: 'iserv',
		url: 'http://mock.de',
		alias: `system #${sequence}`,
		oauthConfig: {
			clientId: '12345',
			clientSecret: 'mocksecret',
			tokenEndpoint: 'http://mock.de/mock/auth/public/mockToken',
			grantType: 'authorization_code',
			tokenRedirectUri: 'http://mockhost:3030/api/v3/sso/oauth/testsystemId/token',
			codeRedirectUri: 'http://mockhost:3030/api/v3/sso/oauth/testsystemId',
			scope: 'openid uuid',
			responseType: 'code',
			authEndpoint: 'mock_authEndpoint',
			provider: 'mock_type',
			logoutEndpoint: 'mock_logoutEndpoint',
			issuer: 'mock_issuer',
			jwksEndpoint: 'mock_jwksEndpoint',
		},
		provisioningStrategy: SystemProvisioningStrategy.UNKNOWN,
	};
});
