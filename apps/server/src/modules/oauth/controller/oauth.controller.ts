import { Configuration } from '@hpi-schul-cloud/commons';
import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ParseObjectIdPipe } from '@shared/controller/pipe/parse-object-id.pipe';
import { ILogger, Logger } from '@src/core/logger';
import { Response } from 'express';
import { OauthUc } from '../uc/oauth.uc';
import { AuthorizationQuery } from './dto/authorization.query';
import { OAuthResponse } from './dto/oauth-response';

@ApiTags('Oauth')
@Controller('oauth')
export class OauthController {
	private logger: ILogger;

	constructor(private readonly oauthUc: OauthUc) {
		this.logger = new Logger(OauthController.name);
	}

	@Get(':systemid')
	async startOauthFlow(
		@Query() query: AuthorizationQuery,
		@Res() res: Response,
		@Param('systemid', ParseObjectIdPipe) systemid: string
	): Promise<unknown> {
		let oauthResponse: OAuthResponse;
		const HOST = Configuration.get('HOST') as string;
		try {
			oauthResponse = await this.oauthUc.startOauth(query, systemid);
			if (oauthResponse.jwt) {
				res.cookie('jwt', oauthResponse.jwt);
				return res.redirect(`${HOST}/dashboard`);
			}
		} catch (error) {
			this.logger.log(error);
			oauthResponse = new OAuthResponse();
			oauthResponse.errorcode = 'OauthLoginFailed';
		}
		if (oauthResponse.errorcode) res.redirect(`${HOST}/login?error=${oauthResponse.errorcode}`);
		return res.redirect(`${HOST}/login?error=unknown.error`);
	}
}
