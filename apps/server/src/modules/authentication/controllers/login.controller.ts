import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../decorator/auth.decorator';
import type { ICurrentUser } from '../interface';
import { LoginDto } from '../uc/dto/login.dto';
import { LoginUc } from '../uc/login.uc';
import { LdapAuthorizationParams, LocalAuthorizationParams, LoginResponse, Oauth2AuthorizationParams } from './dto';
import { LoginResponseMapper } from './mapper/login-response.mapper';

@ApiTags('Authentication')
@Controller('authentication')
export class LoginController {
	constructor(private readonly loginUc: LoginUc) {}

	@UseGuards(AuthGuard('ldap'))
	@HttpCode(HttpStatus.OK)
	@Post('ldap')
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async loginLdap(@CurrentUser() user: ICurrentUser, @Body() _: LdapAuthorizationParams): Promise<LoginResponse> {
		const loginDto: LoginDto = await this.loginUc.getLoginData(user);

		const mapped: LoginResponse = LoginResponseMapper.mapLoginDtoToResponse(loginDto);

		return mapped;
	}

	@UseGuards(AuthGuard('local'))
	@HttpCode(HttpStatus.OK)
	@Post('local')
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async loginLocal(@CurrentUser() user: ICurrentUser, @Body() _: LocalAuthorizationParams): Promise<LoginResponse> {
		const loginDto: LoginDto = await this.loginUc.getLoginData(user);

		const mapped: LoginResponse = LoginResponseMapper.mapLoginDtoToResponse(loginDto);

		return mapped;
	}

	@UseGuards(AuthGuard('oauth2'))
	@HttpCode(HttpStatus.OK)
	@Post('oauth2')
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async loginOauth2(@CurrentUser() user: ICurrentUser, @Body() _: Oauth2AuthorizationParams): Promise<LoginResponse> {
		const loginDto: LoginDto = await this.loginUc.getLoginData(user);

		const mapped: LoginResponse = LoginResponseMapper.mapLoginDtoToResponse(loginDto);

		return mapped;
	}
}
