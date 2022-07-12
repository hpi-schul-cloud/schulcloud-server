import { Injectable } from '@nestjs/common';
import { SystemService } from '@src/modules/system/service/system.service';
import { SystemDto } from '@src/modules/system/service/dto/system.dto';

@Injectable()
export class SystemUc {
	constructor(private readonly systemService: SystemService) {}

	async findByFilter(type: string | undefined = '', onlyOauth = false): Promise<SystemDto[]> {
		return this.systemService.find(type, onlyOauth);
	}
}
