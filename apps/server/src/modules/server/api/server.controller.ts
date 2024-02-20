import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
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
}
