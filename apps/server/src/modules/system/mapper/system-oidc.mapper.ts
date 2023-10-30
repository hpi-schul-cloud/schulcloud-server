import { SystemEntity, OidcConfig } from '@shared/domain/entity/system.entity';
import { OidcConfigDto } from '../service/dto/oidc-config.dto';

export class SystemOidcMapper {
	static mapFromEntityToDto(entity: SystemEntity): OidcConfigDto | undefined {
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

	static mapFromEntitiesToDtos(entities: SystemEntity[]): OidcConfigDto[] {
		return entities
			.map((entity) => this.mapFromEntityToDto(entity))
			.filter((entity): entity is OidcConfigDto => entity !== undefined);
	}
}
