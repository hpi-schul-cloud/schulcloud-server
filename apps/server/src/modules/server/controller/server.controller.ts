import { Controller, Get } from '@nestjs/common';
import { Authenticate, JWT } from '@src/modules/authentication/decorator/auth.decorator';
import { AuthenticationService } from '../../authentication';

@Controller()
export class ServerController {
	constructor(private readonly authserv: AuthenticationService) {}

	// TODO REMOVE
	@Get('test')
	@Authenticate('jwt')
	async getTest(@JWT() jwt: string): Promise<string> {
		await this.authserv.removeJwtFromWhitelist(jwt);
		return 'TEST';
	}

	/** default route to test public access */
	@Get()
	getHello(): string {
		return 'Schulcloud Server API';
	}
}
