import { Injectable } from '@nestjs/common';
import { SystemRepo } from '@shared/repo';
import { SystemMapper } from '@src/modules/system/mapper/system.mapper';
import { SystemDto } from '@src/modules/system/service/dto/system.dto';
import { System } from '@shared/domain';

@Injectable()
export class SystemService {
	constructor(private readonly systemRepo: SystemRepo) {}

	async find(type: string | undefined, onlyOauth = false): Promise<SystemDto[]> {
		let systemEntities: System[];
		if (type === undefined && !onlyOauth) {
			systemEntities = await this.systemRepo.findAll();
		} else {
			systemEntities = await this.systemRepo.findByFilter(type, onlyOauth);
		}
		return SystemMapper.mapFromEntitiesToDtos(systemEntities);
	}
}
