import { Injectable } from '@nestjs/common';
import { SystemRepo } from '@shared/repo';
import { SystemMapper } from '@src/modules/system/mapper/system.mapper';
import { OauthConfigDto } from '@src/modules/system/service/dto/oauth-config.dto';

@Injectable()
export class SystemService {
	constructor(private readonly systemRepo: SystemRepo) {}

	async findOauthConfigs(): Promise<OauthConfigDto[]> {
		const oauthSystems = await this.systemRepo.findOauthSystems();
		const dtos = SystemMapper.mapFromEntitiesToDtos(oauthSystems);

		const oauthConfigs: OauthConfigDto[] = [];
		dtos.forEach((system) => {
			if (system.oauthConfig != null) {
				oauthConfigs.push(system.oauthConfig);
			}
		});

		return oauthConfigs;
	}
}
