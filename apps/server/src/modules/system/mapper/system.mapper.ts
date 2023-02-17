import { OauthConfig, OidcConfig, System } from '@shared/domain';
import { OauthConfigDto } from '@src/modules/system/service/dto/oauth-config.dto';
import { OidcConfigDto } from '@src/modules/system/service/dto/oidc-config.dto';
import { SystemDto } from '@src/modules/system/service/dto/system.dto';

export class SystemMapper {
	static mapFromEntityToDto(entity: System): SystemDto {
		return new SystemDto({
			id: entity.id,
			type: entity.type,
			url: entity.url,
			alias: entity.alias,
			displayName: entity.displayName ?? entity.alias,
			provisioningStrategy: entity.provisioningStrategy,
			provisioningUrl: entity.provisioningUrl,
			oauthConfig: SystemMapper.mapFromOauthConfigEntityToDto(entity.oauthConfig),
			oidcConfig: SystemMapper.mapFromOidcConfigEntityToDto(entity.oidcConfig),
		});
	}

	static mapFromOidcConfigEntityToDto(oidcConfig: OidcConfig | undefined): OidcConfigDto | undefined {
		if (!oidcConfig) return undefined;
		return new OidcConfigDto({
			clientId: oidcConfig.clientId,
			clientSecret: oidcConfig.clientSecret,
			alias: oidcConfig.alias,
			authorizationUrl: oidcConfig.authorizationUrl,
			tokenUrl: oidcConfig.tokenUrl,
			userinfoUrl: oidcConfig.userinfoUrl,
			logoutUrl: oidcConfig.logoutUrl,
			defaultScopes: oidcConfig.defaultScopes,
		});
	}

	static mapFromOauthConfigEntityToDto(oauthConfig: OauthConfig | undefined): OauthConfigDto | undefined {
		if (!oauthConfig) return undefined;
		return new OauthConfigDto({
			clientId: oauthConfig.clientId,
			clientSecret: oauthConfig.clientSecret,
			redirectUri: oauthConfig.redirectUri,
			grantType: oauthConfig.grantType,
			tokenEndpoint: oauthConfig.tokenEndpoint,
			authEndpoint: oauthConfig.authEndpoint,
			responseType: oauthConfig.responseType,
			scope: oauthConfig.scope,
			provider: oauthConfig.provider,
			logoutEndpoint: oauthConfig.logoutEndpoint,
			issuer: oauthConfig.issuer,
			jwksEndpoint: oauthConfig.jwksEndpoint,
		});
	}

	static mapFromEntitiesToDtos(entities: System[]): SystemDto[] {
		return entities.map((entity) => this.mapFromEntityToDto(entity));
	}
}
