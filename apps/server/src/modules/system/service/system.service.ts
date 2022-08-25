import { Injectable } from '@nestjs/common';
import { EntityId, System } from '@shared/domain';
import { SysType } from '@shared/infra/identity-management';
import { SystemRepo } from '@shared/repo';
import { SystemMapper } from '@src/modules/system/mapper/system.mapper';
import { SystemDto } from '@src/modules/system/service/dto/system.dto';

@Injectable()
export class SystemService {
	constructor(private readonly systemRepo: SystemRepo) {}

	async find(type: string | undefined, onlyOauth = false): Promise<SystemDto[]> {
		let systemEntities: System[];
		let oidcSystems: System[];
		if (!type && !onlyOauth) {
			systemEntities = await this.systemRepo.findAll();
			oidcSystems = systemEntities.filter((system) => system.type === SysType.OIDC);
		} else {
			systemEntities = await this.systemRepo.findByFilter(type, onlyOauth);
			oidcSystems = await this.systemRepo.findByFilter(SysType.OIDC);
		}

		const generatedOAuthsystems: System[] = [];
		if (onlyOauth) {
			const keycloakConfig = await this.systemRepo.findByFilter(SysType.KEYCLOAK, true);
			if (keycloakConfig.length === 1) {
				oidcSystems.forEach((systemEntity) => {
					const generatedSystem: System = new System({
						type: SysType.OAUTH,
						alias: systemEntity.alias,
						oauthConfig: keycloakConfig[0].oauthConfig,
					});
					generatedOAuthsystems.push(generatedSystem);
				});
				systemEntities = systemEntities.filter((system) => system.type !== SysType.KEYCLOAK);
			}
		}

		return SystemMapper.mapFromEntitiesToDtos([...systemEntities, ...generatedOAuthsystems]);
	}

	async findById(id: EntityId): Promise<SystemDto> {
		const entity = await this.systemRepo.findById(id);
		return SystemMapper.mapFromEntityToDto(entity);
	}
}
