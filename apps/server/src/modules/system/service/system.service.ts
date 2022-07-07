import { Injectable } from '@nestjs/common';
import { SystemRepo } from '@shared/repo';
import { SystemMapper } from '@src/modules/system/mapper/system.mapper';
import { SystemDto } from '@src/modules/system/service/dto/system.dto';
import { EntityId, System } from '@shared/domain';

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
		const systemDtos: SystemDto[] = SystemMapper.mapFromEntitiesToDtos(systemEntities);
		return systemDtos;
	}

	async findById(id: EntityId): Promise<SystemDto> {
		const entity: System = await this.systemRepo.findById(id);
		const systemDto: SystemDto = SystemMapper.mapFromEntityToDto(entity);
		return systemDto;
	}
}
