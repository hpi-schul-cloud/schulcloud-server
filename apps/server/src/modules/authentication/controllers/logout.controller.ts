import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { LogoutUc } from '../uc';
import { OidcLogoutBodyParams } from './dto';

@ApiTags('Authentication')
@Controller('logout')
export class LogoutController {
	constructor(private readonly logoutUc: LogoutUc) {}

	@HttpCode(HttpStatus.OK)
	@Post('oidc')
	@ApiOperation({ summary: 'Logs out a user for a given logout token from an external oidc system.' })
	@ApiOkResponse({ description: 'Logout was successful.' })
	@ApiUnauthorizedResponse({ description: 'There has been an error while logging out.' })
	async logoutOidc(@Body() body: OidcLogoutBodyParams): Promise<void> {
		await this.logoutUc.logoutOidc(body.logout_token);
	}
}
