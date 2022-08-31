import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Logger } from '@src/core/logger';
import { Response } from 'express';
import { OauthUc } from '../uc/oauth.uc';
import { AuthorizationParams, SystemUrlParams } from './dto';

@ApiTags('SSO')
@Controller('sso')
export class OauthSSOController {
	constructor(private readonly oauthUc: OauthUc, private logger: Logger) {
		this.logger.setContext(OauthSSOController.name);
	}

	@Get('oauth/:systemId')
	async startOauthAuthorizationCodeFlow(
		@Query() query: AuthorizationParams,
		@Res() res: Response,
		@Param() { systemId }: SystemUrlParams
	): Promise<unknown> {
		const oauthResponse = await this.oauthUc.startOauth(query, systemId);
		res.cookie('jwt', oauthResponse.jwt ? oauthResponse.jwt : '');
		return res.redirect(oauthResponse.redirect ? oauthResponse.redirect : '');
	}
}
