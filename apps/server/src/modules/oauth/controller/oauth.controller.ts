/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable no-prototype-builtins */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Controller, Get, Query, Req, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { OauthUc } from '../uc/oauth.uc';
import { AuthorizationCodeQuery } from './dto/authorization-code.query';

@ApiTags('Oauth')
@Controller('oauth')
export class OauthController {
	constructor(private readonly oauthUc: OauthUc) {}

	@Get()
	async getAuthorizationCode(
		@Query() query: AuthorizationCodeQuery,
		@Res() res: Response,
		@Req() req: Request
	): Promise<unknown> {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		console.log('#################### Code #################');
		console.log(query.code);
		console.log(query);

		await this.oauthUc.requestToken(query.code);

		// this.oauthUc.decodeQueryToken(queryToken);
		// postPaylod

		// void this.oauthUc.requestToken(query.authorizationCode);

		// void this.requestToken(query.code);

		return res.redirect('https://google.de');
	}

	// @Get('token')
	// async requestToken(code: string) {

	// }
}
