import { Injectable } from '@nestjs/common';
import { SystemService } from '@src/modules/system/service/system.service';
import { OauthResponse } from '@src/modules/system/controller/dto/oauth.response';
import { OauthResponseMapper } from '@src/modules/system/mapper/oauth-response.mapper';
import { SystemDto } from '@src/modules/system/service/dto/system.dto';

@Injectable()
export class SystemUc {
	constructor(
		private readonly systemService: SystemService,
		private readonly oauthResponseMapper: OauthResponseMapper
	) {}

	async getOauthConfigs(): Promise<OauthResponse> {
		let systems: SystemDto[] = await this.systemService.findOauthSystems();
		let oauthconfigs = systems.flatMap(system => system.oauthConfig);
		return this.oauthResponseMapper.mapFromDtoToResponse(oauthconfigs);
	}
}
