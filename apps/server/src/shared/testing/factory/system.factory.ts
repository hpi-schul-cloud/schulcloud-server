import { ISystemProperties, LdapConfig, OauthConfig, System } from '@shared/domain';
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
				authEndpoint: 'http://mock.de/auth',
				provider: 'mock_type',
				logoutEndpoint: 'http://mock.de/logout',
				issuer: 'mock_issuer',
				jwksEndpoint: 'http://mock.de/jwks',
			}),
		};
		return this.params(params);
	}

	withLdapConfig(): this {
		const params: DeepPartial<ISystemProperties> = {
			ldapConfig: new LdapConfig({
				url: 'ldaps:mock.de:389',
				active: true,
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
		provisioningStrategy: SystemProvisioningStrategy.OIDC,
		provisioningUrl: 'provisioningUrl',
	};
});
