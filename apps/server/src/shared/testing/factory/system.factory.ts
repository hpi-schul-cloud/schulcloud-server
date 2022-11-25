import { ISystemProperties, OauthConfig, System } from '@shared/domain';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { DeepPartial } from 'fishery';
import { BaseFactory } from './base.factory';

export class SystemFactory extends BaseFactory<System, ISystemProperties> {
	withOauthConfig(): this {
		const params: DeepPartial<ISystemProperties> = {
			oauthConfig: new OauthConfig({
				clientId: '12345',
				clientSecret: 'mocksecret',
				tokenEndpoint: 'http://mock.de/mock/auth/public/mockToken',
				grantType: 'authorization_code',
				redirectUri: 'http://mockhost:3030/api/v3/sso/oauth/testsystemId',
				scope: 'openid uuid',
				responseType: 'code',
				authEndpoint: 'mock_authEndpoint',
				provider: 'mock_type',
				logoutEndpoint: 'mock_logoutEndpoint',
				issuer: 'mock_issuer',
				jwksEndpoint: 'mock_jwksEndpoint',
			}),
		};
		return this.params(params);
	}
}

export const systemFactory = SystemFactory.define(System, ({ sequence }) => {
	return {
		type: 'oauth',
		url: 'http://mock.de',
		alias: `system #${sequence}`,
		displayName: `system #${sequence}DisplayName`,
		provisioningStrategy: SystemProvisioningStrategy.UNDEFINED,
		provisioningUrl: 'provisioningUrl',
	};
});
