import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ForbiddenOperationError, ValidationError } from '@shared/common';
import { CurrentUser } from '../decorator/auth.decorator';
import type { ICurrentUser } from '../interface';
import { LoginDto } from '../uc/dto';
import { LoginUc } from '../uc/login.uc';
import {
	LdapAuthorizationBodyParams,
	LocalAuthorizationBodyParams,
	LoginResponse,
	Oauth2AuthorizationBodyParams,
} from './dto';
import { LoginResponseMapper } from './mapper/login-response.mapper';

@ApiTags('Authentication')
@Controller('authentication')
export class LoginController {
	constructor(private readonly loginUc: LoginUc) {}

	@UseGuards(AuthGuard('ldap'))
	@HttpCode(HttpStatus.OK)
	@Post('ldap')
	@ApiOperation({ summary: 'Starts the login process for users which are authenticated via LDAP' })
	@ApiResponse({ status: 200, type: LoginResponse, description: 'Login was successful.' })
	@ApiResponse({ status: 400, type: ValidationError, description: 'Request data has invalid format.' })
	@ApiResponse({ status: 403, type: ForbiddenOperationError, description: 'Invalid user credentials.' })
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async loginLdap(@CurrentUser() user: ICurrentUser, @Body() _: LdapAuthorizationBodyParams): Promise<LoginResponse> {
		const loginDto: LoginDto = await this.loginUc.getLoginData(user);

		const mapped: LoginResponse = LoginResponseMapper.mapLoginDtoToResponse(loginDto);

		return mapped;
	}

	@UseGuards(AuthGuard('local'))
	@HttpCode(HttpStatus.OK)
	@Post('local')
	@ApiOperation({ summary: 'Starts the login process for users which are locally managed.' })
	@ApiResponse({ status: 200, type: LoginResponse, description: 'Login was successful.' })
	@ApiResponse({ status: 400, type: ValidationError, description: 'Request data has invalid format.' })
	@ApiResponse({ status: 403, type: ForbiddenOperationError, description: 'Invalid user credentials.' })
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async loginLocal(@CurrentUser() user: ICurrentUser, @Body() _: LocalAuthorizationBodyParams): Promise<LoginResponse> {
		const loginDto: LoginDto = await this.loginUc.getLoginData(user);

		const mapped: LoginResponse = LoginResponseMapper.mapLoginDtoToResponse(loginDto);

		return mapped;
	}

	@UseGuards(AuthGuard('oauth2'))
	@HttpCode(HttpStatus.OK)
	@Post('oauth2')
	@ApiOperation({ summary: 'Starts the login process for users which are authenticated via OAuth 2.' })
	@ApiResponse({ status: 200, type: LoginResponse, description: 'Login was successful.' })
	@ApiResponse({ status: 400, type: ValidationError, description: 'Request data has invalid format.' })
	@ApiResponse({ status: 403, type: ForbiddenOperationError, description: 'Invalid user credentials.' })
	async loginOauth2(
		@CurrentUser() user: ICurrentUser,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		@Body() _: Oauth2AuthorizationBodyParams
	): Promise<LoginResponse> {
		const loginDto: LoginDto = await this.loginUc.getLoginData(user);

		const mapped: LoginResponse = LoginResponseMapper.mapLoginDtoToResponse(loginDto);

		return mapped;
	}
}
