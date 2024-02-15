import { Controller, Get } from '@nestjs/common';
import { ConfigResponse } from './dto';
import { ServerUc } from './server.uc';

@Controller()
export class ServerController {
	constructor(private readonly serverUc: ServerUc) {}

	/** default route to test public access */
	@Get()
	getHello(): string {
		return 'Schulcloud Server API';
	}

	@Get('config/public')
	publicConfig(): ConfigResponse {
		const configResponse = this.serverUc.getConfig();

		return configResponse;
	}
}
