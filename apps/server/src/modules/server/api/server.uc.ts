import { Inject, Injectable } from '@nestjs/common';
import { ApplicationSettingsConfig } from '../application-settings.config';
import { SERVER_CONFIG_TOKEN } from '../server.config';
import { ConfigResponse } from './dto/config.response';
import { ConfigResponseMapper } from './mapper/config.response.mapper';

@Injectable()
export class ServerUc {

	constructor(@Inject(SERVER_CONFIG_TOKEN) private readonly config: ApplicationSettingsConfig) {}

	public getConfig(): ConfigResponse {
		const configDto = ConfigResponseMapper.mapToResponse(this.config);

		return configDto;
	}
}
