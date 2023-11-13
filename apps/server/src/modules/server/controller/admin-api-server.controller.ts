import { Controller, Get } from '@nestjs/common';

@Controller()
export class AdminApiServerController {
	@Get()
	getHello(): string {
		return 'Admin Server API';
	}
}
