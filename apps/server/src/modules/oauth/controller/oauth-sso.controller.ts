import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { Controller, Get, Param, Query, Req, Res, Session, UnauthorizedException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ICurrentUser } from '@shared/domain';
import { ISession } from '@shared/domain/types/session';
import { Logger } from '@src/core/logger';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { OauthTokenResponse } from '@src/modules/oauth/controller/dto/oauth-token.response';
import { HydraOauthUc } from '@src/modules/oauth/uc/hydra-oauth.uc';
import { CookieOptions, Request, Response } from 'express';
import { OAuthSSOError } from '../error/oauth-sso.error';
import { OAuthProcessDto } from '../service/dto/oauth-process.dto';
import { OauthUc } from '../uc';
import { OauthLoginStateDto } from '../uc/dto/oauth-login-state.dto';
import { AuthorizationParams, LoginParams } from './dto';

@ApiTags('SSO')
@Controller('sso')
export class OauthSSOController {
	constructor(private readonly oauthUc: OauthUc, private readonly hydraUc: HydraOauthUc, private logger: Logger) {
		this.logger.setContext(OauthSSOController.name);
	}

	@Get('login/:systemId')
	async login(@Session() session: ISession, @Res() res: Response, @Param() params: LoginParams): Promise<void> {
		const redirect: string = await this.oauthUc.startOauthLogin(session, params.systemId, params.postLoginRedirect);

		res.redirect(redirect);
	}

	// TODO The system lookup must not be part of the path but of the token instead (EW-325)
	@Get('oauth/:systemId')
	async startOauthAuthorizationCodeFlow(
		@Session() session: ISession,
		@Res() res: Response,
		@Query() query: AuthorizationParams
	): Promise<void> {
		const cookieDefaultOptions: CookieOptions = {
			httpOnly: Configuration.get('COOKIE__HTTP_ONLY') as boolean,
			sameSite: Configuration.get('COOKIE__SAME_SITE') as 'lax' | 'strict' | 'none',
			secure: Configuration.get('COOKIE__SECURE') as boolean,
			expires: new Date(Date.now() + (Configuration.get('COOKIE__EXPIRES_SECONDS') as number)),
		};

		const oauthLoginState: OauthLoginStateDto | undefined = session.oauthLoginState
			? new OauthLoginStateDto(session.oauthLoginState as OauthLoginStateDto)
			: undefined;

		if (!oauthLoginState) {
			throw new UnauthorizedException('Oauth session not found');
		}

		if (oauthLoginState.state !== query.state) {
			throw new UnauthorizedException(`Invalid state. Got: ${query.state} Expected: ${oauthLoginState.state}`);
		}

		try {
			const oauthProcessDto: OAuthProcessDto = await this.oauthUc.processOAuth(
				oauthLoginState,
				query.code,
				query.error
			);

			if (oauthProcessDto.jwt) {
				res.cookie('jwt', oauthProcessDto.jwt, cookieDefaultOptions);
			}

			res.redirect(oauthProcessDto.redirect);
		} catch (error) {
			this.logger.error(error);
			const ssoError: OAuthSSOError = error instanceof OAuthSSOError ? error : new OAuthSSOError();

			if (oauthLoginState.errorRedirect) {
				res.redirect(oauthLoginState.errorRedirect);
			} else {
				const errorRedirect = new URL('/login', Configuration.get('HOST') as string);
				errorRedirect.searchParams.append('error', ssoError.errorcode);
				if (ssoError.provider) {
					errorRedirect.searchParams.append('provider', ssoError.provider);
				}

				res.redirect(errorRedirect.toString());
			}
		}
	}

	@Get('hydra/:oauthClientId')
	@Authenticate('jwt')
	async getHydraOauthToken(
		@Query() query: AuthorizationParams,
		@Param('oauthClientId') oauthClientId: string
	): Promise<OauthTokenResponse> {
		const oauthToken = this.hydraUc.getOauthToken(query, oauthClientId);
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
}
