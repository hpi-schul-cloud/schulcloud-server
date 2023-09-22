import { Injectable } from '@nestjs/common';
import { EntityNotFoundError } from '@shared/common';
import { EntityId, SystemEntity, SystemTypeEnum } from '@shared/domain';
import { SystemRepo } from '@shared/repo';
import { SystemOidcMapper } from '@src/modules/system/mapper/system-oidc.mapper';
import { OidcConfigDto } from './dto';

@Injectable()
export class SystemOidcService {
	constructor(private readonly systemRepo: SystemRepo) {}

	async findById(id: EntityId): Promise<OidcConfigDto> {
		const system = await this.systemRepo.findById(id);
		const mappedEntity = SystemOidcMapper.mapFromEntityToDto(system);
		if (!mappedEntity) {
			throw new EntityNotFoundError(SystemEntity.name, { id });
		}
		return mappedEntity;
	}

	async findAll(): Promise<[] | OidcConfigDto[]> {
		const system = await this.systemRepo.findByFilter(SystemTypeEnum.OIDC);
		return SystemOidcMapper.mapFromEntitiesToDtos(system);
	}
}
