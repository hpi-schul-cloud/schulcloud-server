import { CurrentUser, ICurrentUser, JWT, JwtAuthentication } from '@infra/auth-guard';
import { Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { LogoutUc } from '../uc';

@ApiTags('Authentication')
@Controller('logout')
export class LogoutController {
	constructor(private readonly logoutUc: LogoutUc) {}

	@JwtAuthentication()
	@Post()
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Logs out a user.' })
	@ApiOkResponse({ description: 'Logout was successful.' })
	@ApiUnauthorizedResponse({ description: 'There has been an error while logging out.' })
	async logout(@JWT() jwt: string): Promise<void> {
		await this.logoutUc.logout(jwt);
	}

	@JwtAuthentication()
	@Post('/external')
	@HttpCode(HttpStatus.OK)
	async logoutTest(@CurrentUser() user: ICurrentUser): Promise<void> {
		await this.logoutUc.externalSystemLogout(user);
	}
}
