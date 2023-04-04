import { Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import type { ICurrentUser } from '../interface';
import { CurrentUser } from '../decorator/auth.decorator';
import { LdapAuthorizationParams, LocalAuthorizationParams, LoginResponse, Oauth2AuthorizationParams } from './dto';
import { LoginUc } from '../uc/login.uc';
import { LoginResponseMapper } from './mapper/login-response.mapper';
import { LoginDto } from '../uc/dto/login.dto';

@ApiTags('Authentication')
@Controller('authentication')
export class LoginController {
	constructor(private readonly loginUc: LoginUc) {}

	@UseGuards(AuthGuard('ldap'))
	@HttpCode(HttpStatus.OK)
	@Post('ldap')
	@ApiBody({ type: LdapAuthorizationParams })
	async loginLdap(@CurrentUser() user: ICurrentUser): Promise<LoginResponse> {
		const loginDto: LoginDto = await this.loginUc.getLoginData(user);

		const mapped: LoginResponse = LoginResponseMapper.mapLoginDtoToResponse(loginDto);

		return mapped;
	}

	@UseGuards(AuthGuard('local'))
	@HttpCode(HttpStatus.OK)
	@Post('local')
	@ApiBody({ type: LocalAuthorizationParams })
	async loginLocal(@CurrentUser() user: ICurrentUser): Promise<LoginResponse> {
		const loginDto: LoginDto = await this.loginUc.getLoginData(user);

		const mapped: LoginResponse = LoginResponseMapper.mapLoginDtoToResponse(loginDto);

		return mapped;
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
