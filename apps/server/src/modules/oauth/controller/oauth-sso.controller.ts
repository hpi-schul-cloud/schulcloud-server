import { Controller, ForbiddenException, Get, Param, Query, Req, Res, UnauthorizedException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ParseObjectIdPipe } from '@shared/controller/pipe/parse-object-id.pipe';
import { Logger } from '@src/core/logger';
import { Request, Response } from 'express';
import { HydraOauthUc } from '@src/modules/oauth/uc/hydraOauth.uc';
import { OauthTokenResponse } from '@src/modules/oauth/controller/dto/oauth-token.response';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { ICurrentUser } from '@shared/domain';
import { HydraParams } from '@src/modules/oauth/controller/dto/hydra.params';
import { OauthUc } from '../uc/oauth.uc';
import { AuthorizationParams } from './dto/authorization.params';

@ApiTags('SSO')
@Controller('sso')
export class OauthSSOController {
	constructor(private readonly oauthUc: OauthUc, private readonly hydraUc: HydraOauthUc, private logger: Logger) {
		this.logger.setContext(OauthSSOController.name);
	}

	@Get('oauth/:systemid')
	async startOauthAuthorizationCodeFlow(
		@Query() query: AuthorizationParams,
		@Res() res: Response,
		@Param('systemid', ParseObjectIdPipe) systemid: string
	): Promise<unknown> {
		const oauthResponse = await this.oauthUc.processOAuth(query, systemid);
		res.cookie('jwt', oauthResponse.jwt ? oauthResponse.jwt : '');
		return res.redirect(oauthResponse.redirect ? oauthResponse.redirect : '');
	}

	@Get('hydra/:oauthClientId')
	@Authenticate('jwt')
	async getHydraOauthToken(
		@Query() query: AuthorizationParams,
		@Param() { oauthClientId }: HydraParams
	): Promise<OauthTokenResponse> {
		return this.hydraUc.getOauthToken(query, oauthClientId);
	}

	@Get('auth/:oauthClientId')
	@Authenticate('jwt')
	async requestAuthToken(
		@CurrentUser() currentUser: ICurrentUser,
		@Req() req: Request,
		@Param() { oauthClientId }: HydraParams
	): Promise<AuthorizationParams> {
		let jwt: string;
		const authHeader: string | undefined = req.headers.authorization;
		if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
			// eslint-disable-next-line prefer-destructuring
			jwt = authHeader.split(' ')[1];
		} else {
			throw new UnauthorizedException(
				`No bearer token in header for authorization process of user ${currentUser.userId} on oauth system ${oauthClientId}`
			);
		}
		return this.hydraUc.requestAuthCode(currentUser.userId, jwt, oauthClientId);
	}
}
