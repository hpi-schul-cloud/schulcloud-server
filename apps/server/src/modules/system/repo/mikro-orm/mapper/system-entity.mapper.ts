import { LdapConfigEntity, OauthConfigEntity, SystemEntity } from '@shared/domain/entity';
import { LdapConfig, OauthConfig, System, SystemFactory } from '../../../domain';

export class SystemEntityMapper {
	public static mapToDo(entity: SystemEntity): System {
		const system = SystemFactory.build({
			id: entity.id,
			url: entity.url,
			type: entity.type,
			provisioningUrl: entity.provisioningUrl,
			provisioningStrategy: entity.provisioningStrategy,
			displayName: entity.displayName,
			alias: entity.alias,
			oauthConfig: entity.oauthConfig ? this.mapOauthConfigEntityToDomainObject(entity.oauthConfig) : undefined,
			ldapConfig: entity.ldapConfig ? this.mapLdapConfigEntityToDomainObject(entity.ldapConfig) : undefined,
		});

		return system;
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
