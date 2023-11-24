import { LdapConfigEntity, OauthConfigEntity, SystemEntity } from '@shared/domain';
import { LdapConfig, OauthConfig, SystemProps } from '../domain';

export class SystemDomainMapper {
	public static mapEntityToDomainObjectProperties(entity: SystemEntity): SystemProps {
		const mapped: SystemProps = {
			id: entity.id,
			url: entity.url,
			type: entity.type,
			provisioningUrl: entity.provisioningUrl,
			provisioningStrategy: entity.provisioningStrategy,
			displayName: entity.displayName,
			alias: entity.alias,
			oauthConfig: entity.oauthConfig ? this.mapOauthConfigEntityToDomainObject(entity.oauthConfig) : undefined,
			ldapConfig: entity.ldapConfig ? this.mapLdapConfigEntityToDomainObject(entity.ldapConfig) : undefined,
		};

		return mapped;
	}

	private static mapOauthConfigEntityToDomainObject(oauthConfig: OauthConfigEntity): OauthConfig {
		const mapped: OauthConfig = new OauthConfig({
			clientId: oauthConfig.clientId,
			clientSecret: oauthConfig.clientSecret,
			idpHint: oauthConfig.idpHint,
			authEndpoint: oauthConfig.authEndpoint,
			responseType: oauthConfig.responseType,
			scope: oauthConfig.scope,
			provider: oauthConfig.provider,
			logoutEndpoint: oauthConfig.logoutEndpoint,
			issuer: oauthConfig.issuer,
			jwksEndpoint: oauthConfig.jwksEndpoint,
			grantType: oauthConfig.grantType,
			tokenEndpoint: oauthConfig.tokenEndpoint,
			redirectUri: oauthConfig.redirectUri,
		});

		return mapped;
	}

	private static mapLdapConfigEntityToDomainObject(ldapConfig: LdapConfigEntity): LdapConfig {
		const mapped: LdapConfig = new LdapConfig({
			active: !!ldapConfig.active,
			url: ldapConfig.url,
			provider: ldapConfig.provider,
		});

		return mapped;
	}
}
