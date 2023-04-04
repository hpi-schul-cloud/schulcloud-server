import { CookieOptions, Response } from 'express';
import { Controller, Get, HttpCode, HttpStatus, Post, Query, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { ApiImplicitBody } from '@nestjs/swagger/dist/decorators/api-implicit-body.decorator';
import type { ICurrentUser } from '../interface';
import { CurrentUser } from '../decorator/auth.decorator';
import { AuthenticationService } from '../services/authentication.service';
import { OauthAuthorizationQueryParams } from './oauth-authorization.params';
import { LoginResponse, Oauth2AuthorizationParams } from './dto';
import { LoginUc } from '../uc/login.uc';
import { LoginResponseMapper } from './mapper/login-response.mapper';
import { LoginDto } from '../uc/dto/login.dto';

@ApiTags('Authentication')
@Controller('authentication')
export class LoginController {
	constructor(private readonly authService: AuthenticationService, private readonly loginUc: LoginUc) {}

	@UseGuards(AuthGuard('ldap'))
	@HttpCode(HttpStatus.OK)
	@Post('ldap')
	loginLdap(@CurrentUser() user: ICurrentUser): Promise<{ accessToken: string }> {
		return this.authService.generateJwt(user);
	}

	@UseGuards(AuthGuard('local'))
	@HttpCode(HttpStatus.OK)
	@Post('local')
	loginLocal(@CurrentUser() user: ICurrentUser): Promise<{ accessToken: string }> {
		return this.authService.generateJwt(user);
	}

	@UseGuards(AuthGuard('oauth'))
	@HttpCode(HttpStatus.OK)
	@Get('oauth/:systemId')
	async loginOauth(
		@CurrentUser() user: ICurrentUser,
		@Query() queryParams: OauthAuthorizationQueryParams,
		@Res() res: Response
	): Promise<void> {
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

	@UseGuards(AuthGuard('oauth2'))
	@HttpCode(HttpStatus.OK)
	@Post('oauth2')
	@ApiBody({ type: Oauth2AuthorizationParams })
	async loginOauth2(@CurrentUser() user: ICurrentUser): Promise<LoginResponse> {
		const loginDto: LoginDto = await this.loginUc.getLoginData(user);

		const mapped: LoginResponse = LoginResponseMapper.mapLoginDtoToResponse(loginDto);

		return mapped;
	}
}
