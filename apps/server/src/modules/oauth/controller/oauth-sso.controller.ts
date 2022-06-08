import { Configuration } from '@hpi-schul-cloud/commons';
import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ParseObjectIdPipe } from '@shared/controller/pipe/parse-object-id.pipe';
import { Logger } from '@src/core/logger';
import { Response } from 'express';
import { OAuthSSOError } from '../error/oauth-sso.error';
import { OauthUc } from '../uc/oauth.uc';
import { AuthorizationParams } from './dto/authorization.params';
import { OAuthResponse } from './dto/oauth.response';

@ApiTags('SSO')
@Controller('sso')
export class OauthSSOController {
	constructor(private readonly oauthUc: OauthUc, private logger: Logger) {
		this.logger.setContext(OauthSSOController.name);
	}

	@Get('oauth/:systemid')
	async startOauthAuthorizationCodeFlow(
		@Query() query: AuthorizationParams,
		@Res() res: Response,
		@Param('systemid', ParseObjectIdPipe) systemid: string
	): Promise<unknown> {
		let oauthResponse: OAuthResponse;
		const HOST = Configuration.get('HOST') as string;
		try {
			oauthResponse = await this.oauthUc.startOauth(query, systemid);
			if (oauthResponse.jwt) {
				res.cookie('jwt', oauthResponse.jwt);
				const idToken = oauthResponse.idToken as string;
				const logoutEndpoint = oauthResponse.logoutEndpoint as string;
				const provider = oauthResponse.provider as string;
				if (provider === 'iserv') {
					return res.redirect(`${logoutEndpoint}?id_token_hint=${idToken}&post_logout_redirect_uri=${HOST}/dashboard`);
				}
				return res.redirect(`${HOST}/dashboard`);
			}
		} catch (error) {
			this.logger.error(error);
			oauthResponse = new OAuthResponse();
			if (error instanceof OAuthSSOError) oauthResponse.errorcode = error.errorcode;
			else oauthResponse.errorcode = 'oauth_login_failed';
		}
		return res.redirect(`${HOST}/login?error=${oauthResponse.errorcode as string}`);
	}
}
