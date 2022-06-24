import { OauthConfig, System } from '@shared/domain';
import { SystemDto } from '@src/modules/system/service/dto/system.dto';
import { OauthConfigDto } from '@src/modules/system/service/dto/oauth-config.dto';

export class SystemMapper {
	static mapFromEntityToDto(entity: System): SystemDto {
		return new SystemDto({
			type: entity.type,
			url: entity.url,
			alias: entity.alias,
			oauthConfig: SystemMapper.mapFromOauthConfigEntityToDto(entity.oauthConfig),
		});
	}

	static mapFromOauthConfigEntityToDto(oauthConfig: OauthConfig | undefined): OauthConfigDto | undefined {
		if (oauthConfig == null) {
			return undefined;
		}
		return new OauthConfigDto({
			clientId: oauthConfig.clientId,
			clientSecret: oauthConfig.clientSecret,
			tokenRedirectUri: oauthConfig.tokenRedirectUri,
			grantType: oauthConfig.grantType,
			tokenEndpoint: oauthConfig.tokenEndpoint,
			authEndpoint: oauthConfig.authEndpoint,
			responseType: oauthConfig.responseType,
			scope: oauthConfig.scope,
			provider: oauthConfig.provider,
			logoutEndpoint: oauthConfig.logoutEndpoint,
			issuer: oauthConfig.issuer,
			jwksEndpoint: oauthConfig.jwksEndpoint,
			codeRedirectUri: oauthConfig.codeRedirectUri,
		});
	}

	static mapFromEntitiesToDtos(enities: System[]): SystemDto[] {
		return enities.map((entity) => {
			return this.mapFromEntityToDto(entity);
		});
	}
}
