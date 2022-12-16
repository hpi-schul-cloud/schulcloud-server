import { CookieOptions, Response } from 'express';
import { Controller, Post, UseGuards, HttpCode, HttpStatus, Query, Res, Get } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { ICurrentUser } from '@shared/domain';
import { CurrentUser } from '../decorator/auth.decorator';
import { AuthenticationService } from '../services/authentication.service';

@Controller('authentication')
export class LoginController {
	constructor(private authService: AuthenticationService) {}

	@UseGuards(AuthGuard('ldap'))
	@HttpCode(HttpStatus.OK)
	@Post('ldap')
	loginLdap(@CurrentUser() user: ICurrentUser) {
		return this.authService.generateJwt(user);
	}

	@UseGuards(AuthGuard('local'))
	@HttpCode(HttpStatus.OK)
	@Post('local')
	loginLocal(@CurrentUser() user: ICurrentUser) {
		return this.authService.generateJwt(user);
	}

	@UseGuards(AuthGuard('oauth'))
	@HttpCode(HttpStatus.OK)
	@Get('oauth/:systemId')
	async loginOauth(
		@CurrentUser() user: ICurrentUser,
		@Query() queryParams: { redirect: string },
		@Res() res: Response
	) {
		const jwt = await this.authService.generateJwt(user);
		const cookieDefaultOptions: CookieOptions = {
			httpOnly: Configuration.get('COOKIE__HTTP_ONLY') as boolean,
			sameSite: Configuration.get('COOKIE__SAME_SITE') as 'lax' | 'strict' | 'none',
			secure: Configuration.get('COOKIE__SECURE') as boolean,
			expires: new Date(Date.now() + (Configuration.get('COOKIE__EXPIRES_SECONDS') as number)),
		};
		res.cookie('jwt', jwt.accessToken, cookieDefaultOptions);
		res.redirect(queryParams.redirect);
	}
}
