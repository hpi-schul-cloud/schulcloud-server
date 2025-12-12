import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ConfigResponse } from './dto';
import { ServerUc } from './server.uc';

@Controller('config')
export class ServerConfigController {
	constructor(private readonly serverUc: ServerUc) {}

	@ApiOperation({ summary: 'Useable configuration for clients' })
	@ApiResponse({ status: 200, type: ConfigResponse })
	@Get('/public')
	public async publicConfig(): Promise<ConfigResponse> {
		const configResponse = await this.serverUc.getConfig();

		return configResponse;
	}
}
