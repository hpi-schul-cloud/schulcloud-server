import { Controller, Get } from '@nestjs/common';

@Controller()
export class ServerController {
	/** default route to test public access */
	@Get()
	getHello(): string {
		return 'Schulcloud Server API';
	}
}
