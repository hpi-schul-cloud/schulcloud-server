import { Injectable } from '@nestjs/common';
import { EntityId, SystemType, SystemTypeEnum } from '@shared/domain';
import { SystemDto } from '@src/modules/system/service/dto/system.dto';
import { SystemService } from '@src/modules/system/service/system.service';

@Injectable()
export class SystemUc {
	constructor(private readonly systemService: SystemService) {}

	async findByFilter(type?: SystemType, onlyOauth = false): Promise<SystemDto[]> {
		let systems: SystemDto[];

		if (onlyOauth) {
			systems = await this.systemService.findByType(SystemTypeEnum.OAUTH);
		} else {
			systems = await this.systemService.findByType(type);
		}

		return systems;
	}

	async findById(id: EntityId): Promise<SystemDto> {
		const system: SystemDto = await this.systemService.findById(id);

		return system;
	}
}
