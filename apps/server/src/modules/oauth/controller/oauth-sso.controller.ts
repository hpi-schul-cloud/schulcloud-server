import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ParseObjectIdPipe } from '@shared/controller/pipe/parse-object-id.pipe';
import { Logger } from '@src/core/logger';
import { Response } from 'express';
import { HydraOauthUc } from '@src/modules/oauth/uc/hydraOauth.uc';
import { OauthTokenResponse } from '@src/modules/oauth/controller/dto/oauth-token.response';
import { Authenticate, CurrentUser } from '@src/modules/authentication/decorator/auth.decorator';
import { ICurrentUser } from '@shared/domain';
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

	@Get('hydra')
	@Authenticate('jwt')
	async getHydraOauthToken(@Query() query: AuthorizationParams): Promise<OauthTokenResponse> {
		return this.hydraUc.getOauthToken(query);
	}
}
