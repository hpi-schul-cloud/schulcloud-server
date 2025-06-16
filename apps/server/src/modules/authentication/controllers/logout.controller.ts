import { CurrentUser, ICurrentUser, JWT, JwtAuthentication } from '@infra/auth-guard';
import { Body, Controller, Header, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
	ApiForbiddenResponse,
	ApiInternalServerErrorResponse,
	ApiOkResponse,
	ApiOperation,
	ApiTags,
	ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { LogoutUc } from '../uc';
import { OidcLogoutBodyParams } from './dto';

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
		console.log('<<<<<<<<<<<<<<<<<< Standard log out of SVS.');
		await this.logoutUc.logout(jwt);
	}

	/**
	 * @see https://openid.net/specs/openid-connect-backchannel-1_0.html
	 */
	@HttpCode(HttpStatus.OK)
	@Header('Cache-Control', 'no-store')
	@Post('oidc')
	@ApiOperation({ summary: 'Logs out a user for a given logout token from an external oidc system.' })
	@ApiOkResponse({ description: 'Logout was successful.' })
	@ApiUnauthorizedResponse({ description: 'There has been an error while logging out.' })
	async logoutOidc(@Body() body: OidcLogoutBodyParams): Promise<void> {
		console.log('<<<<<<<<<<<<<<<<<< Backchannel logout from external system.');
		await this.logoutUc.logoutOidc(body.logout_token);
	}

	@JwtAuthentication()
	@Post('/external')
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Logs out a user from the external system.' })
	@ApiOkResponse({ description: 'External system logout was successful.' })
	@ApiInternalServerErrorResponse({
		description: 'There has been an error while logging out from the external system.',
	})
	@ApiForbiddenResponse({
		description: 'The feature is not enabled on this server',
	})
	async externalSystemLogout(@CurrentUser() user: ICurrentUser): Promise<void> {
		await this.logoutUc.externalSystemLogout(user);
	}
}
