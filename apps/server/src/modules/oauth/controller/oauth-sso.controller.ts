import { Controller, Get, Param, Query, Req, Res, UnauthorizedException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Logger } from '@src/core/logger';
import { CookieOptions, Request, Response } from 'express';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { HydraOauthUc } from '@src/modules/oauth/uc/hydraOauth.uc';
import { OauthTokenResponse } from '@src/modules/oauth/controller/dto/oauth-token.response';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { ICurrentUser } from '@shared/domain';
import { OauthUc } from '../uc/oauth.uc';
import { AuthorizationParams, SystemUrlParams } from './dto';

@ApiTags('SSO')
@Controller('sso')
export class OauthSSOController {
	constructor(private readonly oauthUc: OauthUc, private readonly hydraUc: HydraOauthUc, private logger: Logger) {
		this.logger.setContext(OauthSSOController.name);
	}

	// TODO The system lookup must not be part of the path but of the token instead (EW-325)
	@Get('oauth/:systemId')
	async startOauthAuthorizationCodeFlow(
		@Query() query: AuthorizationParams,
		@Res() res: Response,
		@Param() urlParams: SystemUrlParams
	): Promise<void> {
		const oauthResponse = await this.oauthUc.processOAuth(query, urlParams.systemId);
		const cookieDefaultOptions: CookieOptions = {
			httpOnly: Configuration.get('COOKIE__HTTP_ONLY') as boolean,
			sameSite: Configuration.get('COOKIE__SAME_SITE') as 'lax' | 'strict' | 'none',
			secure: Configuration.get('COOKIE__SECURE') as boolean,
			expires: new Date(Date.now() + (Configuration.get('COOKIE__EXPIRES_SECONDS') as number)),
		};
		res.cookie('jwt', oauthResponse.jwt ? oauthResponse.jwt : '', cookieDefaultOptions);
		res.redirect(oauthResponse.redirect ? oauthResponse.redirect : '');
	}

	@Get('hydra/:oauthClientId')
	@Authenticate('jwt')
	async getHydraOauthToken(
		@Query() query: AuthorizationParams,
		@Param('oauthClientId') oauthClientId: string
	): Promise<OauthTokenResponse> {
		return this.hydraUc.getOauthToken(query, oauthClientId);
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
