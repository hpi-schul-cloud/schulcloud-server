import { OidcConfig, System } from '@shared/domain';
import { OidcConfigDto } from '@src/modules/system/service/dto/oidc-config.dto';

export class SystemOidcMapper {
	static mapFromEntityToDto(entity: System): OidcConfigDto | undefined {
		if (entity.oidcConfig) {
			return SystemOidcMapper.mapFromOidcConfigEntityToDto(entity.id, entity.oidcConfig);
		}
		return undefined;
	}

	static mapFromOidcConfigEntityToDto(systemId: string, oidcConfig: OidcConfig): OidcConfigDto {
		return new OidcConfigDto({
			parentSystemId: systemId,
			clientId: oidcConfig.clientId,
			clientSecret: oidcConfig?.clientSecret,
			idpHint: oidcConfig.idpHint,
			authorizationUrl: oidcConfig.authorizationUrl,
			tokenUrl: oidcConfig.tokenUrl,
			userinfoUrl: oidcConfig.userinfoUrl,
			logoutUrl: oidcConfig.logoutUrl,
			defaultScopes: oidcConfig.defaultScopes,
		});
	}

	static mapFromEntitiesToDtos(entities: System[]): OidcConfigDto[] {
		return entities
			.map((entity) => this.mapFromEntityToDto(entity))
			.filter((entity): entity is OidcConfigDto => entity !== undefined);
	}
}
