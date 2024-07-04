import { LdapConfig, OauthConfig, OidcConfig, System } from '../../../domain';
import { LdapConfigEntity, OauthConfigEntity, OidcConfigEntity, SystemEntity } from '../../../entity';

export class SystemEntityMapper {
	public static mapToDo(entity: SystemEntity): System {
		const system = new System({
			id: entity.id,
			url: entity.url,
			type: entity.type,
			provisioningUrl: entity.provisioningUrl,
			provisioningStrategy: entity.provisioningStrategy,
			displayName: entity.displayName,
			alias: entity.alias,
			oauthConfig: entity.oauthConfig ? this.mapOauthConfigEntityToDomainObject(entity.oauthConfig) : undefined,
			ldapConfig: entity.ldapConfig ? this.mapLdapConfigEntityToDomainObject(entity.ldapConfig) : undefined,
			oidcConfig: entity.oidcConfig ? this.mapOidcConfigEntityToDomainObject(entity.oidcConfig) : undefined,
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
			federalState: ldapConfig.federalState,
			lastSyncAttempt: ldapConfig.lastSyncAttempt,
			lastSuccessfulFullSync: ldapConfig.lastSuccessfulFullSync,
			lastSuccessfulPartialSync: ldapConfig.lastSuccessfulPartialSync,
			lastModifyTimestamp: ldapConfig.lastModifyTimestamp,
			rootPath: ldapConfig.rootPath,
			searchUser: ldapConfig.searchUser,
			searchUserPassword: ldapConfig.searchUserPassword,
			providerOptions: ldapConfig.providerOptions,
		});

		return mapped;
	}

	private static mapOidcConfigEntityToDomainObject(oidcConfig: OidcConfigEntity): OidcConfig {
		const mapped: OidcConfig = new OidcConfig({
			clientId: oidcConfig.clientId,
			clientSecret: oidcConfig?.clientSecret,
			idpHint: oidcConfig.idpHint,
			authorizationUrl: oidcConfig.authorizationUrl,
			tokenUrl: oidcConfig.tokenUrl,
			userinfoUrl: oidcConfig.userinfoUrl,
			logoutUrl: oidcConfig.logoutUrl,
			defaultScopes: oidcConfig.defaultScopes,
		});

		return mapped;
	}
}
