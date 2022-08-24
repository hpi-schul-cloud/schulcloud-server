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
		if (type === '' && !onlyOauth) {
			systemEntities = await this.systemRepo.findAll();
		} else {
			systemEntities = await this.systemRepo.findByFilter(type, onlyOauth);
		}
		const keycloakConfig = (await this.systemRepo.findByFilter(SysType.KEYCLOAK, true))[0];
		systemEntities.forEach((systemEntity) => {
			if (systemEntity.type === SysType.OIDC && !systemEntity.oauthConfig) {
				systemEntity.oauthConfig = keycloakConfig.oauthConfig;
			}
		});
		return SystemMapper.mapFromEntitiesToDtos(systemEntities);
	}

	async findById(id: EntityId): Promise<SystemDto> {
		const entity = await this.systemRepo.findById(id);
		return SystemMapper.mapFromEntityToDto(entity);
	}
}
