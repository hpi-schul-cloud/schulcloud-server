import { Injectable } from '@nestjs/common';
import { EntityNotFoundError } from '@shared/common/error/entity-not-found.error';
import { SystemEntity } from '@shared/domain/entity/system.entity';
import { EntityId } from '@shared/domain/types/entity-id';
import { SystemTypeEnum } from '@shared/domain/types/system.type';
import { SystemRepo } from '@shared/repo/system/system.repo';
import { SystemOidcMapper } from '../mapper/system-oidc.mapper';
import { OidcConfigDto } from './dto/oidc-config.dto';

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
