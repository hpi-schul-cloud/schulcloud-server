import { Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { ServerService } from './server.service';

@Controller()
export class ServerController {
	constructor(private readonly serverService: ServerService) {}

	/** default route to test public access */
	@Get()
	getHello(): string {
		return this.serverService.getHello();
	}
}
