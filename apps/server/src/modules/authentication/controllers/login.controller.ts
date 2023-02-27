import { CookieOptions, Response } from 'express';
import { Controller, Post, UseGuards, HttpCode, HttpStatus, Query, Res, Get } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { ICurrentUser } from '@shared/domain';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../decorator/auth.decorator';
import { AuthenticationService } from '../services/authentication.service';
import { OauthAuthorizationQueryParams } from './oauth-authorization.params';

@ApiTags('Authentication')
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
		@Query() queryParams: OauthAuthorizationQueryParams,
		@Res() res: Response
	) {
		// the userId can be undefined if the school is in migration from another login strategy to OAuth
		if (user.userId) {
			const jwt = await this.authService.generateJwt(user);
			const cookieDefaultOptions: CookieOptions = {
				httpOnly: Configuration.get('COOKIE__HTTP_ONLY') as boolean,
				sameSite: Configuration.get('COOKIE__SAME_SITE') as 'lax' | 'strict' | 'none',
				secure: Configuration.get('COOKIE__SECURE') as boolean,
				expires: new Date(Date.now() + (Configuration.get('COOKIE__EXPIRES_SECONDS') as number)),
			};
			res.cookie('jwt', jwt.accessToken, cookieDefaultOptions);
		}
		if (queryParams.redirect) {
			res.redirect(queryParams.redirect);
		}
	}
}
