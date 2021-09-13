import { Controller, Get } from '@nestjs/common';
import { Console, Command } from 'nestjs-console';

@Controller()
@Console({ command: 'server' })
export class ServerController {
	/** default route to test public access */
	@Get()
	@Command({ command: 'hello-world', description: 'render test output' })
	getHello(): string {
		return 'Schulcloud Server API';
	}
}
