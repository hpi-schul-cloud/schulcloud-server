import { Injectable } from '@nestjs/common';
import { SystemService } from '@src/modules/system/service/system.service';
import { SystemDto } from '@src/modules/system/service/dto/system.dto';
import { EntityId } from '@shared/domain';

@Injectable()
export class SystemUc {
	constructor(private readonly systemService: SystemService) {}

	async findByFilter(type: string | undefined = '', onlyOauth = false): Promise<SystemDto[]> {
		if (onlyOauth) {
			return this.systemService.findOAuth();
		}
		return this.systemService.find(type);
	}

	async findById(id: EntityId): Promise<SystemDto> {
		const promise: Promise<SystemDto> = this.systemService.findById(id);
		return promise;
	}
}
