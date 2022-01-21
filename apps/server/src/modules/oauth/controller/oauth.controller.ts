/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable no-prototype-builtins */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Controller, Get, Param, Query, Req, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { OauthUc } from '../uc/oauth.uc';
import { AuthorizationCodeQuery } from './dto/authorization-code.query';
import { AuthorizationErrorQuery } from './dto/authorization-error.query';
import { OauthTokenResponse } from './dto/oauthTokenResponse';

@ApiTags('Oauth')
@Controller('oauth')
export class OauthController {
	constructor(private readonly oauthUc: OauthUc) {}

	@Get(':systemid')
	async getAuthorizationCode(
		@Query() query: AuthorizationCodeQuery | AuthorizationErrorQuery,
		@Res() res: Response,
		@Param('systemid') systemid: string
	): Promise<unknown> {
		console.log('############# test ##########');
		console.log(systemid);
		if ((query as AuthorizationCodeQuery).code !== undefined) {
			console.log((query as AuthorizationCodeQuery).code);
			const queryToken: OauthTokenResponse = await this.oauthUc.requestToken((query as AuthorizationCodeQuery).code);
			await this.oauthUc.decodeToken(queryToken.id_token);
			// ToDo: redirect auf Frontend
			return res.redirect('https://google.de');
		}
		return res.redirect('https://niedersachsen.de');
	}
}
