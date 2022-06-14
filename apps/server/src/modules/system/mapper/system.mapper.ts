import { System } from '@shared/domain';
import { SystemDto } from '@src/modules/system/service/dto/system.dto';
import { OauthConfigDto } from '@src/modules/system/service/dto/oauth-config.dto';

export class SystemMapper {
	static mapFromEntityToDto(entity: System): SystemDto {
		return new SystemDto({
			type: entity.type,
			url: entity.url,
			alias: entity.alias,
			oauthConfig: entity.oauthConfig
				? new OauthConfigDto({
						clientId: entity.oauthConfig.clientId,
						clientSecret: entity.oauthConfig.clientSecret,
						tokenRedirectUri: entity.oauthConfig.tokenRedirectUri,
						grantType: entity.oauthConfig.grantType,
						tokenEndpoint: entity.oauthConfig.tokenEndpoint,
						authEndpoint: entity.oauthConfig.authEndpoint,
						responseType: entity.oauthConfig.responseType,
						scope: entity.oauthConfig.scope,
						provider: entity.oauthConfig.provider,
						logoutEndpoint: entity.oauthConfig.logoutEndpoint,
						issuer: entity.oauthConfig.issuer,
						jwksEndpoint: entity.oauthConfig.jwksEndpoint,
						codeRedirectUri: entity.oauthConfig.codeRedirectUri,
				  })
				: undefined,
		});
	}

	static mapFromEntitiesToDtos(enities: System[]): SystemDto[] {
		return enities.map((entity) => {
			return this.mapFromEntityToDto(entity);
		});
	}
}
