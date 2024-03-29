import { OauthConfigDto } from '@modules/system/service/dto/oauth-config.dto';
import { SystemDto } from '@modules/system/service/dto/system.dto';
import { OauthConfigEntity, SystemEntity } from '@shared/domain/entity';

export class SystemMapper {
	static mapFromEntityToDto(entity: SystemEntity): SystemDto {
		return new SystemDto({
			id: entity.id,
			type: entity.type,
			url: entity.url,
			alias: entity.alias,
			displayName: entity.displayName ?? entity.alias,
			provisioningStrategy: entity.provisioningStrategy,
			provisioningUrl: entity.provisioningUrl,
			oauthConfig: SystemMapper.mapFromOauthConfigEntityToDto(entity.oauthConfig),
			ldapActive: entity.ldapConfig?.active,
		});
	}

	static mapFromOauthConfigEntityToDto(oauthConfig: OauthConfigEntity | undefined): OauthConfigDto | undefined {
		if (!oauthConfig) return undefined;
		return new OauthConfigDto({
			clientId: oauthConfig.clientId,
			clientSecret: oauthConfig.clientSecret,
			idpHint: oauthConfig.idpHint,
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

	static mapFromEntitiesToDtos(entities: SystemEntity[]): SystemDto[] {
		return entities.map((entity) => this.mapFromEntityToDto(entity));
	}
}
