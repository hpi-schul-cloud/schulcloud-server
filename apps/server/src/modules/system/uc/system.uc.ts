import { Injectable } from '@nestjs/common';
import { EntityId, SystemType } from '@shared/domain';
import { SystemDto } from '@src/modules/system/service/dto/system.dto';
import { SystemService } from '@src/modules/system/service/system.service';

@Injectable()
export class SystemUc {
	constructor(private readonly systemService: SystemService) {}

	async findByFilter(type?: SystemType, onlyOauth = false): Promise<SystemDto[]> {
		if (onlyOauth) {
			return this.systemService.findOAuth();
		}
		return this.systemService.findAll(type);
	}

	async findById(id: EntityId): Promise<SystemDto> {
		const promise: Promise<SystemDto> = this.systemService.findById(id);
		return promise;
	}
}
