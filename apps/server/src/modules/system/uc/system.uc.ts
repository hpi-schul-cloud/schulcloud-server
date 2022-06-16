import { Injectable } from '@nestjs/common';
import { SystemService } from '@src/modules/system/service/system.service';
import { SystemOauthResponse } from '@src/modules/system/controller/dto/system-oauth.response';
import { SystemOauthResponseMapper } from '@src/modules/system/controller/mapper/system-oauth-response.mapper';
import { SystemDto } from '@src/modules/system/service/dto/system.dto';

@Injectable()
export class SystemUc {
	constructor(private readonly systemService: SystemService) {}

	async findByFilter(type: string | undefined = '', onlyOauth = false): Promise<SystemOauthResponse> {
		const systemDtos: SystemDto[] = await this.systemService.find(type, onlyOauth);
		return SystemOauthResponseMapper.mapFromDtoToResponse(systemDtos);
	}
}
