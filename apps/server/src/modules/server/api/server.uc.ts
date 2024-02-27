import { Inject, Injectable } from '@nestjs/common';
import { ConfigResponseMapper } from './mapper/config.response.mapper';
import { ConfigResponse } from './dto/config.response';
import { SERVER_CONFIG_TOKEN, ServerConfig } from '../server.config';

@Injectable()
export class ServerUc {
	constructor(@Inject(SERVER_CONFIG_TOKEN) private readonly config: ServerConfig) {}

	public getConfig(): ConfigResponse {
		const configDto = ConfigResponseMapper.mapToResponse(this.config);

		return configDto;
	}
}
