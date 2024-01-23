import { Injectable } from '@nestjs/common';
import { EntityNotFoundError } from '@shared/common';
import { SystemEntity } from '@shared/domain/entity';
import { EntityId, SystemTypeEnum } from '@shared/domain/types';
import { LegacySystemRepo } from '@shared/repo';
import { SystemOidcMapper } from '../mapper';
import { OidcConfigDto } from './dto';

@Injectable()
export class SystemOidcService {
	constructor(private readonly systemRepo: LegacySystemRepo) {}

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
