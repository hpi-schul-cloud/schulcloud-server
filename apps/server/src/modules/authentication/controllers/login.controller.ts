import { CurrentUser, ICurrentUser, JWT, JwtAuthentication } from '@infra/auth-guard';
import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ForbiddenOperationError, ValidationError } from '@shared/common/error';
import { StrategyType, type OauthCurrentUser } from '../interface';
import { LoginUc } from '../uc/login.uc';
import {
	LdapAuthorizationBodyParams,
	LocalAuthorizationBodyParams,
	LoginResponse,
	Oauth2AuthorizationBodyParams,
	OauthLoginResponse,
	SessionInfoResponse,
} from './dto';
import { LoginResponseMapper } from './mapper/login-response.mapper';

@ApiTags('Authentication')
@Controller('authentication')
export class LoginController {
	constructor(private readonly loginUc: LoginUc) {}

	@UseGuards(AuthGuard(StrategyType.LDAP))
	@HttpCode(HttpStatus.OK)
	@Post('ldap')
	@ApiOperation({ summary: 'Starts the login process for users which are authenticated via LDAP' })
	@ApiResponse({ status: 200, type: LoginResponse, description: 'Login was successful.' })
	@ApiResponse({ status: 400, type: ValidationError, description: 'Request data has invalid format.' })
	@ApiResponse({ status: 403, type: ForbiddenOperationError, description: 'Invalid user credentials.' })
	// Body is not used, but validated and used in the strategy implementation
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async loginLdap(
		@CurrentUser() user: ICurrentUser,
		@Body() _: LdapAuthorizationBodyParams
	): Promise<LoginResponse> {
		const jwtToken = await this.loginUc.getLoginData(user);
		const loginResponse = LoginResponseMapper.mapToLoginResponse(jwtToken);

		return loginResponse;
	}

	@UseGuards(AuthGuard(StrategyType.LOCAL))
	@HttpCode(HttpStatus.OK)
	@Post('local')
	@ApiOperation({ summary: 'Starts the login process for users which are locally managed.' })
	@ApiResponse({ status: 200, type: LoginResponse, description: 'Login was successful.' })
	@ApiResponse({ status: 400, type: ValidationError, description: 'Request data has invalid format.' })
	@ApiResponse({ status: 403, type: ForbiddenOperationError, description: 'Invalid user credentials.' })
	public async loginLocal(
		@CurrentUser() user: ICurrentUser,
		// Body is not used, but validated and used in the strategy implementation
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		@Body() _: LocalAuthorizationBodyParams
	): Promise<LoginResponse> {
		const jwtToken = await this.loginUc.getLoginData(user);
		const loginResponse = LoginResponseMapper.mapToLoginResponse(jwtToken);

		return loginResponse;
	}

	@UseGuards(AuthGuard(StrategyType.LOCAL))
	@HttpCode(HttpStatus.OK)
	@Post('local-service-account')
	@ApiOperation({ summary: 'Starts the login process for service accounts which are locally managed.' })
	@ApiResponse({ status: 200, type: LoginResponse, description: 'Login was successful.' })
	@ApiResponse({ status: 400, type: ValidationError, description: 'Request data has invalid format.' })
	@ApiResponse({ status: 401, description: 'Authenticated user is not a service account.' })
	@ApiResponse({ status: 403, type: ForbiddenOperationError, description: 'Invalid user credentials.' })
	public async loginLocalServiceAccount(
		@CurrentUser() user: ICurrentUser,
		// Body is not used, but validated and used in the strategy implementation
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		@Body() _: LocalAuthorizationBodyParams
	): Promise<LoginResponse> {
		const jwtToken = await this.loginUc.getLoginDataForServiceAccount(user);
		const loginResponse = LoginResponseMapper.mapToLoginResponse(jwtToken);

		return loginResponse;
	}

	@UseGuards(AuthGuard(StrategyType.OAUTH2))
	@HttpCode(HttpStatus.OK)
	@Post('oauth2')
	@ApiOperation({ summary: 'Starts the login process for users which are authenticated via OAuth 2.' })
	@ApiResponse({ status: 200, type: OauthLoginResponse, description: 'Login was successful.' })
	@ApiResponse({ status: 400, type: ValidationError, description: 'Request data has invalid format.' })
	@ApiResponse({ status: 403, type: ForbiddenOperationError, description: 'Invalid user credentials.' })
	public async loginOauth2(
		@CurrentUser() user: OauthCurrentUser,
		// Body is not used, but validated and used in the strategy implementation
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		@Body() _: Oauth2AuthorizationBodyParams
	): Promise<OauthLoginResponse> {
		const jwtToken = await this.loginUc.getLoginData(user);
		const oAuthLoginResponse = LoginResponseMapper.mapToOauthLoginResponse(jwtToken, user.externalIdToken);

		return oAuthLoginResponse;
	}

	@JwtAuthentication()
	@HttpCode(HttpStatus.OK)
	@Post('refresh-session')
	@ApiOperation({ summary: 'Extends the lifetime of the current session.' })
	@ApiResponse({ status: 200, type: SessionInfoResponse, description: 'Session was successfully extended.' })
	@ApiResponse({ status: 401, description: 'Unauthorized.' })
	public async extendSession(@JWT() accessToken: string): Promise<SessionInfoResponse> {
		const sessionInfoResponse = await this.loginUc.extendSession(accessToken);

		return sessionInfoResponse;
	}
}
