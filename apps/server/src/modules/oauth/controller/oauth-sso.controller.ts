import { Configuration } from '@hpi-schul-cloud/commons/lib';
import {
	Controller,
	Get,
	InternalServerErrorException,
	Param,
	Query,
	Req,
	Res,
	Session,
	UnauthorizedException,
	UnprocessableEntityException,
} from '@nestjs/common';
import { ApiOkResponse, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ISession } from '@shared/domain/types/session';
import { LegacyLogger } from '@src/core/logger';
import { ICurrentUser } from '@src/modules/authentication';
import { Authenticate, CurrentUser, JWT } from '@src/modules/authentication/decorator/auth.decorator';
import { UserMigrationResponse } from '@src/modules/oauth/controller/dto/user-migration.response';
import { HydraOauthUc } from '@src/modules/oauth/uc/hydra-oauth.uc';
import { OAuthMigrationError } from '@src/modules/user-login-migration/error/oauth-migration.error';
import { MigrationDto } from '@src/modules/user-login-migration/service/dto';
import { CookieOptions, Request, Response } from 'express';
import { OAuthSSOError } from '../error/oauth-sso.error';
import { OAuthTokenDto } from '../interface';
import { OauthLoginStateMapper } from '../mapper/oauth-login-state.mapper';
import { UserMigrationMapper } from '../mapper/user-migration.mapper';
import { OAuthProcessDto } from '../service/dto';
import { OauthUc } from '../uc';
import { OauthLoginStateDto } from '../uc/dto/oauth-login-state.dto';
import { AuthorizationParams, SSOLoginQuery, SystemIdParams } from './dto';
import { StatelessAuthorizationParams } from './dto/stateless-authorization.params';

@ApiTags('SSO')
@Controller('sso')
export class OauthSSOController {
	private readonly clientUrl: string;

	constructor(
		private readonly oauthUc: OauthUc,
		private readonly hydraUc: HydraOauthUc,
		private readonly logger: LegacyLogger
	) {
		this.logger.setContext(OauthSSOController.name);
		this.clientUrl = Configuration.get('HOST') as string;
	}

	private errorHandler(error: unknown, session: ISession, res: Response, provider?: string) {
		this.logger.error(error);
		const ssoError: OAuthSSOError = error instanceof OAuthSSOError ? error : new OAuthSSOError();

		session.destroy((err) => {
			this.logger.log(err);
		});

		const errorRedirect: URL = new URL('/login', this.clientUrl);
		errorRedirect.searchParams.append('error', ssoError.errorcode);

		if (provider) {
			errorRedirect.searchParams.append('provider', provider);
		}

		res.redirect(errorRedirect.toString());
	}

	private migrationErrorHandler(error: unknown, session: ISession, res: Response) {
		const migrationError: OAuthMigrationError =
			error instanceof OAuthMigrationError ? error : new OAuthMigrationError();

		session.destroy((err) => {
			this.logger.log(err);
		});

		const errorRedirect: URL = new URL('/migration/error', this.clientUrl);

		if (migrationError.officialSchoolNumberFromSource && migrationError.officialSchoolNumberFromTarget) {
			errorRedirect.searchParams.append('sourceSchoolNumber', migrationError.officialSchoolNumberFromSource);
			errorRedirect.searchParams.append('targetSchoolNumber', migrationError.officialSchoolNumberFromTarget);
		}

		res.redirect(errorRedirect.toString());
	}

	private sessionHandler(session: ISession, query: AuthorizationParams): OauthLoginStateDto {
		if (!session.oauthLoginState) {
			throw new UnauthorizedException('Oauth session not found');
		}

		const oauthLoginState: OauthLoginStateDto = OauthLoginStateMapper.mapSessionToDto(session);

		if (oauthLoginState.state !== query.state) {
			throw new UnauthorizedException(`Invalid state. Got: ${query.state} Expected: ${oauthLoginState.state}`);
		}

		return oauthLoginState;
	}

	@Get('login/:systemId')
	async getAuthenticationUrl(
		@Session() session: ISession,
		@Res() res: Response,
		@Param() params: SystemIdParams,
		@Query() query: SSOLoginQuery
	): Promise<void> {
		try {
			const redirect: string = await this.oauthUc.startOauthLogin(session, params.systemId, query.postLoginRedirect);

			res.redirect(redirect);
		} catch (error) {
			this.errorHandler(error, session, res);
		}
	}

	@Get('oauth')
	async startOauthAuthorizationCodeFlow(
		@Session() session: ISession,
		@Res() res: Response,
		@Query() query: AuthorizationParams
	): Promise<void> {
		const oauthLoginState: OauthLoginStateDto = this.sessionHandler(session, query);

		try {
			const oauthProcessDto: OAuthProcessDto = await this.oauthUc.processOAuthLogin(
				oauthLoginState,
				query.code,
				query.error
			);

			if (oauthProcessDto.jwt) {
				const cookieDefaultOptions: CookieOptions = {
					httpOnly: Configuration.get('COOKIE__HTTP_ONLY') as boolean,
					sameSite: Configuration.get('COOKIE__SAME_SITE') as 'lax' | 'strict' | 'none',
					secure: Configuration.get('COOKIE__SECURE') as boolean,
					expires: new Date(Date.now() + (Configuration.get('COOKIE__EXPIRES_SECONDS') as number)),
				};

				res.cookie('jwt', oauthProcessDto.jwt, cookieDefaultOptions);
			}

			res.redirect(oauthProcessDto.redirect);
		} catch (error) {
			this.errorHandler(error, session, res, oauthLoginState.provider);
		}
	}

	@Get('hydra/:oauthClientId')
	@Authenticate('jwt')
	async getHydraOauthToken(
		@Query() query: StatelessAuthorizationParams,
		@Param('oauthClientId') oauthClientId: string
	): Promise<OAuthTokenDto> {
		const oauthToken = this.hydraUc.getOauthToken(oauthClientId, query.code, query.error);
		return oauthToken;
	}

	@Get('auth/:oauthClientId')
	@Authenticate('jwt')
	async requestAuthToken(
		@CurrentUser() currentUser: ICurrentUser,
		@Req() req: Request,
		@Param('oauthClientId') oauthClientId: string
	): Promise<AuthorizationParams> {
		let jwt: string;
		const authHeader: string | undefined = req.headers.authorization;
		if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
			[, jwt] = authHeader.split(' ');
		} else {
			throw new UnauthorizedException(
				`No bearer token in header for authorization process of user ${currentUser.userId} on oauth system ${oauthClientId}`
			);
		}
		return this.hydraUc.requestAuthCode(currentUser.userId, jwt, oauthClientId);
	}

	@Get('oauth/migration')
	@Authenticate('jwt')
	@ApiOkResponse({ description: 'The User has been succesfully migrated.' })
	@ApiResponse({ type: InternalServerErrorException, description: 'The migration of the User was not possible. ' })
	async migrateUser(
		@JWT() jwt: string,
		@Session() session: ISession,
		@CurrentUser() currentUser: ICurrentUser,
		@Query() query: AuthorizationParams,
		@Res() res: Response
	): Promise<void> {
		const oauthLoginState: OauthLoginStateDto = this.sessionHandler(session, query);

		if (!currentUser.systemId) {
			throw new UnprocessableEntityException('Current user does not have a system.');
		}

		try {
			const migration: MigrationDto = await this.oauthUc.migrate(jwt, currentUser.userId, query, oauthLoginState);
			const response: UserMigrationResponse = UserMigrationMapper.mapDtoToResponse(migration);
			res.redirect(response.redirect);
		} catch (error) {
			this.migrationErrorHandler(error, session, res);
		}
	}
}
