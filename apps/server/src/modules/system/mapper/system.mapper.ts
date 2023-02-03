import {OauthConfig, OidcConfig, System} from '@shared/domain';
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
		if (oidcConfig != null && oidcConfig.authorizationUrl && oidcConfig.clientId && oidcConfig.clientSecret && oidcConfig.defaultScopes) {
			return new OidcConfigDto({
				authorizationUrl: oidcConfig.authorizationUrl as string,
				clientId: oidcConfig.clientId as string,
				clientSecret: oidcConfig.clientSecret as string,
				defaultScopes: oidcConfig.defaultScopes as string,
				logoutUrl: (oidcConfig.logoutUrl as string) ?? '',
				tokenUrl: (oidcConfig.tokenUrl as string) ?? '',
				userinfoUrl: (oidcConfig.userinfoUrl as string) ?? '',
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
		return enities.map((entity) => this.mapFromEntityToDto(entity));
	}
}
