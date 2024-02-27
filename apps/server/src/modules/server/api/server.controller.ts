import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller()
export class ServerController {
	@ApiOperation({ summary: 'Default route to test public access' })
	@ApiResponse({ status: 200, type: String })
	@Get()
	getHello(): { message: string } {
		return { message: 'Schulcloud Server API' };
	}
}
