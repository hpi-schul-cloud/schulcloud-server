import { LdapConfigEntity, OauthConfigEntity, SystemEntity } from '@shared/domain';
import { LdapConfig, OauthConfig, SystemProps } from '../domain';

export class SystemDomainMapper {
	/* For later use
	public static mapDomainObjectToEntityProperties(system: System): SystemEntityProps {
		const props: SystemProps = system.getProps();

		const mapped: SystemEntityProps = {
			alias: props.alias,
			displayName: props.displayName,
			type: props.type,
			url: props.url,
			provisioningStrategy: props.provisioningStrategy,
			provisioningUrl: props.provisioningUrl,
			oauthConfig: props.oauthConfig ? this.mapOauthConfigDomainObjectToEntity(props.oauthConfig) : undefined,
			ldapConfig: props.ldapConfig ? this.mapLdapConfigDomainObjectToEntity(props.ldapConfig) : undefined,
			oidcConfig: undefined,
		};

		return mapped;
	}

	private static mapOauthConfigDomainObjectToEntity(oauthConfig: OauthConfig): OauthConfigEntity {
		const mapped: OauthConfigEntity = new OauthConfigEntity({
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

	private static mapLdapConfigDomainObjectToEntity(ldapConfig: LdapConfig): LdapConfigEntity {
		const mapped: LdapConfigEntity = new LdapConfigEntity({
			active: ldapConfig.active,
			url: ldapConfig.url,
			provider: ldapConfig.provider,
		});

		return mapped;
	} */

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
