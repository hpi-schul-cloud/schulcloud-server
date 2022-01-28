import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { OauthUc } from '../uc/oauth.uc';
import { AuthorizationQuery } from './dto/authorization.query';
import { OAuthResponse } from './dto/oauth.response';

@ApiTags('Oauth')
@Controller('oauth')
export class OauthController {
	constructor(private readonly oauthUc: OauthUc) {}

	@Get(':systemid')
	async startOauthFlow(
		@Query() query: AuthorizationQuery,
		@Res() res: Response,
		@Param('systemid') systemid: string
	): Promise<unknown> {
		const oauthResponse: OAuthResponse = await this.oauthUc.startOauth(query, systemid);
		if (oauthResponse.jwt) res.cookie('jwt', oauthResponse.jwt);
		return res.redirect(oauthResponse.redirectUri);
	}
}
