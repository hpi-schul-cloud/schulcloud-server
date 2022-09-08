import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Logger } from '@src/core/logger';
import { CookieOptions, Response } from 'express';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
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
		@Param() urlParams: SystemUrlParams
	): Promise<void> {
		const oauthResponse = await this.oauthUc.startOauth(query, urlParams.systemId);
		const cookieDefaultOptions: CookieOptions = {
			httpOnly: Configuration.get('COOKIE__HTTP_ONLY') as boolean,
			sameSite: Configuration.get('COOKIE__SAME_SITE') as 'lax' | 'strict' | 'none',
			secure: Configuration.get('COOKIE__SECURE') as boolean,
			expires: new Date(Date.now() + (Configuration.get('COOKIE__EXPIRES_SECONDS') as number)),
		};
		res.cookie('jwt', oauthResponse.jwt ? oauthResponse.jwt : '', cookieDefaultOptions);
		res.redirect(oauthResponse.redirect ? oauthResponse.redirect : '');
	}
}
