import {
	LdapConfigEntity,
	OauthConfigEntity,
	OidcConfigEntity,
	SystemEntity,
	SystemEntityProps,
} from '@shared/domain/entity';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { SystemTypeEnum } from '@shared/domain/types';
import { DeepPartial } from 'fishery';
import { BaseFactory } from './base.factory';

export class SystemEntityFactory extends BaseFactory<SystemEntity, SystemEntityProps> {
	withOauthConfig(): this {
		const params: DeepPartial<SystemEntityProps> = {
			type: SystemTypeEnum.OAUTH,
			oauthConfig: new OauthConfigEntity({
				clientId: '12345',
				clientSecret: 'mocksecret',
				idpHint: 'mock-oauth-idpHint',
				tokenEndpoint: 'https://mock.de/mock/auth/public/mockToken',
				grantType: 'authorization_code',
				redirectUri: 'https://mockhost:3030/api/v3/sso/oauth/',
				scope: 'openid uuid',
				responseType: 'code',
				authEndpoint: 'https://mock.de/auth',
				provider: 'mock_type',
				logoutEndpoint: 'https://mock.de/logout',
				issuer: 'mock_issuer',
				jwksEndpoint: 'https://mock.de/jwks',
			}),
		};
		return this.params(params);
	}

	withLdapConfig(otherParams?: DeepPartial<LdapConfigEntity>): this {
		const params: DeepPartial<SystemEntityProps> = {
			type: SystemTypeEnum.LDAP,
			ldapConfig: new LdapConfigEntity({
				url: 'ldaps:mock.de:389',
				active: true,
				...otherParams,
			}),
		};

		return this.params(params);
	}

	withOidcConfig(): this {
		const params = {
			type: SystemTypeEnum.OIDC,
			oidcConfig: new OidcConfigEntity({
				clientId: 'mock-client-id',
				clientSecret: 'mock-client-secret',
				idpHint: 'mock-oidc-idpHint',
				defaultScopes: 'openid email userinfo',
				authorizationUrl: 'https://mock.tld/auth',
				tokenUrl: 'https://mock.tld/token',
				userinfoUrl: 'https://mock.tld/userinfo',
				logoutUrl: 'https://mock.tld/logout',
			}),
		};
		return this.params(params);
	}
}

export const systemEntityFactory = SystemEntityFactory.define(SystemEntity, ({ sequence }) => {
	return {
		type: 'oauth',
		url: 'https://mock.de',
		alias: `system #${sequence}`,
		displayName: `system #${sequence}DisplayName`,
		provisioningStrategy: SystemProvisioningStrategy.OIDC,
		provisioningUrl: 'https://provisioningurl.de/',
	};
});
