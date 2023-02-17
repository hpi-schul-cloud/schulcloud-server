import { ISystemProperties, LdapConfig, OauthConfig, OidcConfig, System } from '@shared/domain';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { DeepPartial } from 'fishery';
import { BaseFactory } from './base.factory';

export class SystemFactory extends BaseFactory<System, ISystemProperties> {
	withOauthConfig(): this {
		const params: DeepPartial<ISystemProperties> = {
			oauthConfig: new OauthConfig({
				clientId: 'mock-client-id',
				clientSecret: 'mock-client-secret',
				tokenEndpoint: 'http://mock.tld/token',
				grantType: 'mock-grant-type',
				redirectUri: 'http://mock-app.tld/redirect',
				scope: 'openid uuid email',
				responseType: 'code',
				authEndpoint: 'http://mock.tld/auth',
				provider: 'mock-provider',
				logoutEndpoint: 'http://mock.tld/logout',
				issuer: 'mock-issuer',
				jwksEndpoint: 'http://mock.tld/jwks',
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

	withOidcConfig(): this {
		const params = {
			oidcConfig: new OidcConfig({
				clientId: 'mock-client-id',
				clientSecret: 'mock-client-secret',
				alias: 'mock-alias',
				defaultScopes: 'openid email userinfo',
				authorizationUrl: 'http://mock.tld/auth',
				tokenUrl: 'http://mock.tld/token',
				userinfoUrl: 'http://mock.tld/userinfo',
				logoutUrl: 'http://mock.tld/logout',
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
