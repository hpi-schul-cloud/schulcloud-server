/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable no-prototype-builtins */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Controller, Get, Query, Req, Res } from '@nestjs/common';
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

	@Get()
	async getAuthorizationCode(
		@Query() query: AuthorizationCodeQuery | AuthorizationErrorQuery,
		@Res() res: Response
	): Promise<unknown> {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		console.log('#################### Code #################');
		console.log('Query()', query);

		if ((query as AuthorizationCodeQuery).code !== undefined) {
			console.log((query as AuthorizationCodeQuery).code);
			console.log(query);

			const queryToken: OauthTokenResponse = await this.oauthUc.requestToken((query as AuthorizationCodeQuery).code);
			await this.oauthUc.decodeToken(queryToken.id_token);
			// ToDo: redirect auf Frontend
			return res.redirect('https://google.de');
		}
		console.log('ERROR ####################### KEIN CODE');
		return res.redirect('https://niedersachsen.de');

		// await this.oauthUc.decodeToken(queryError.error);

		// console.log('Req() ', req.query.code);
		// console.log('Req() mit stringy ', JSON.stringify(req.query.code));
		// const queryToken = await this.oauthUc.requestToken(JSON.stringify(req.query.code));
		// await this.oauthUc.decodeToken(queryd.code);

		// this.oauthUc.decodeQueryToken(queryToken);
		// postPaylod

		// void this.oauthUc.requestToken(query.authorizationCode);

		// void this.requestToken(query.code);

		// return res.redirect('https://google.de');
	}

	// @Get('token')
	// async requestToken(code: string) {

	// }
}
