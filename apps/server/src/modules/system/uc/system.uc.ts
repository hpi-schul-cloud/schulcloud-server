import { Injectable } from '@nestjs/common';
import { EntityId, SystemType, SystemTypeEnum } from '@shared/domain';
import { SystemDto } from '@src/modules/system/service/dto/system.dto';
import { SystemService } from '@src/modules/system/service/system.service';

@Injectable()
export class SystemUc {
	constructor(private readonly systemService: SystemService) {}

	async findByFilter(type?: SystemType, onlyOauth = false): Promise<SystemDto[]> {
		if (onlyOauth) {
			return this.systemService.findByType(SystemTypeEnum.OAUTH);
		}
		return this.systemService.findByType(type);
	}

	async findById(id: EntityId): Promise<SystemDto> {
		const promise: Promise<SystemDto> = this.systemService.findById(id);
		return promise;
	}
}
