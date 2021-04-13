import { Controller, Get } from '@nestjs/common';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { ServerService } from './server.service';

@Controller()
export class ServerController {
	constructor(private readonly serverService: ServerService) {}

	/** default route to test public access */
	@Get()
	getHello(): string {
		return this.serverService.getHello();
	}

	/** default route to test authenticated access */
	@UseGuards(JwtAuthGuard)
	@Get('profile')
	getProfile(@Request() req) {
		return req.user;
	}
}
