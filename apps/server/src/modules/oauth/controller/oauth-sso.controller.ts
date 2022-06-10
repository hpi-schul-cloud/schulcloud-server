import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ParseObjectIdPipe } from '@shared/controller/pipe/parse-object-id.pipe';
import { Logger } from '@src/core/logger';
import { Response } from 'express';
import { OauthUc } from '../uc/oauth.uc';
import { AuthorizationParams } from './dto/authorization.params';

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
		const oauthResponse = await this.oauthUc.startOauth(query, systemid);
		// if (oauthResponse.jwt && oauthResponse.redirect) {
		res.cookie('jwt', oauthResponse.jwt ? oauthResponse.jwt : '');
		return res.redirect(oauthResponse.redirect ? oauthResponse.redirect : '');
		// }
	}
}
