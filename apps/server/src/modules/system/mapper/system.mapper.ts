import { OauthConfig, System } from '@shared/domain';
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
			oidcConfig: SystemMapper.mapFromOidcConfigEntityToDto(entity.config),
		});
	}

	static mapFromOidcConfigEntityToDto(config: Record<string, unknown> | undefined): OidcConfigDto | undefined {
		if (config != null && config.authorizationUrl && config.clientId && config.clientSecret && config.defaultScopes) {
			return new OidcConfigDto({
				authorizationUrl: config.authorizationUrl as string,
				clientId: config.clientId as string,
				clientSecret: config.clientSecret as string,
				defaultScopes: config.defaultScopes as string,
				logoutUrl: (config.logoutUrl as string) ?? '',
				tokenUrl: (config.tokenUrl as string) ?? '',
				userinfoUrl: (config.userinfoUrl as string) ?? '',
			});
		}
		return undefined;
	}

	static mapFromOauthConfigEntityToDto(oauthConfig: OauthConfig | undefined): OauthConfigDto | undefined {
		if (oauthConfig == null) {
			return undefined;
		}
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

	static mapFromEntitiesToDtos(enities: System[]): SystemDto[] {
		return enities.map((entity) => {
			return this.mapFromEntityToDto(entity);
		});
	}
}
