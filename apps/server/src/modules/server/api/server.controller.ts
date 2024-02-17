import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ConfigResponse } from './dto';
import { ServerUc } from './server.uc';

@Controller()
export class ServerController {
	constructor(private readonly serverUc: ServerUc) {}

	@ApiOperation({ summary: 'Default route to test public access' })
	@ApiResponse({ status: 200, type: String })
	@Get()
	getHello(): string {
		return 'Schulcloud Server API';
	}

	@ApiOperation({ summary: 'Useable configuration for clients' })
	@ApiResponse({ status: 200, type: ConfigResponse })
	@Get('config/public')
	publicConfig(): ConfigResponse {
		const configResponse = this.serverUc.getConfig();

		return configResponse;
	}
}
