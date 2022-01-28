import { Configuration } from '@hpi-schul-cloud/commons';
import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ParseObjectIdPipe } from '@shared/controller/pipe/parse-object-id.pipe';
import { Response } from 'express';
import { OauthUc } from '../uc/oauth.uc';
import { AuthorizationQuery } from './dto/authorization.query';
import { OAuthResponse } from './dto/oauth-response';

@ApiTags('Oauth')
@Controller('oauth')
export class OauthController {
	constructor(private readonly oauthUc: OauthUc) {}

	@Get(':systemid')
	async startOauthFlow(
		@Query() query: AuthorizationQuery,
		@Res() res: Response,
		@Param('systemid', ParseObjectIdPipe) systemid: string
	): Promise<unknown> {
		const oauthResponse: OAuthResponse = await this.oauthUc.startOauth(query, systemid);
		const HOST = Configuration.get('HOST') as string;
		if (oauthResponse.jwt) {
			res.cookie('jwt', oauthResponse.jwt);
			return res.redirect(`${HOST}/dashboard`);
		}
		if (oauthResponse.errorcode) res.redirect(`${HOST}/login?error=${oauthResponse.errorcode}`);
		return res.redirect(`${HOST}/login?error=unknown.error`);
	}
}
