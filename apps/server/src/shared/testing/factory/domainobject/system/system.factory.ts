import { ObjectId } from '@mikro-orm/mongodb';
import { LdapConfig, OauthConfig, OidcConfig, System, SystemProps, SystemType } from '@modules/system/domain';
import { DeepPartial, Factory } from 'fishery';
import { DomainObjectFactory } from '../domain-object.factory';

export const systemOauthConfigFactory = Factory.define<OauthConfig>(
	() =>
		new OauthConfig({
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
		})
);

export const systemLdapConfigFactory = Factory.define<LdapConfig>(
	() =>
		new LdapConfig({
			active: true,
			url: 'ldaps://test.ldap/',
		})
);

export const systemOidcConfigFactory = Factory.define<OidcConfig>(
	() =>
		new OidcConfig({
			clientId: 'mock-client-id',
			clientSecret: 'mock-client-secret',
			idpHint: 'mock-oidc-idpHint',
			defaultScopes: 'openid email userinfo',
			authorizationUrl: 'https://mock.tld/auth',
			tokenUrl: 'https://mock.tld/token',
			userinfoUrl: 'https://mock.tld/userinfo',
			logoutUrl: 'https://mock.tld/logout',
		})
);

class SystemFactory extends DomainObjectFactory<System, SystemProps> {
	withOauthConfig(params?: DeepPartial<OauthConfig>): this {
		const oauthConfig: OauthConfig = systemOauthConfigFactory.build(params);

		return this.params({
			type: SystemType.OAUTH,
			oauthConfig,
		});
	}

	withLdapConfig(params?: DeepPartial<LdapConfig>): this {
		const ldapConfig: LdapConfig = systemLdapConfigFactory.build(params);

		return this.params({
			type: SystemType.LDAP,
			ldapConfig,
		});
	}

	withOidcConfig(params?: DeepPartial<OidcConfig>): this {
		const oidcConfig: OidcConfig = systemOidcConfigFactory.build(params);

		return this.params({
			type: SystemType.OIDC,
			oidcConfig,
		});
	}
}

export const systemFactory = SystemFactory.define(System, () => {
	return {
		id: new ObjectId().toHexString(),
		type: SystemType.OAUTH,
	};
});
