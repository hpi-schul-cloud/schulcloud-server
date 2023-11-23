import { SystemOidcMapper } from '@modules/system/mapper/system-oidc.mapper';
import { Injectable } from '@nestjs/common';
import { EntityNotFoundError } from '@shared/common';
import { SystemEntity } from '@shared/domain';
import { EntityId, SystemTypeEnum } from '@shared/domain/types';
import { SystemRepo } from '@shared/repo';
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
