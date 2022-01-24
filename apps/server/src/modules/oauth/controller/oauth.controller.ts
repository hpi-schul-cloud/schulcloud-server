/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable no-prototype-builtins */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Controller, Get, Param, Query, Req, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { User } from '@shared/domain';
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
		try {
			// check if query has an authorization code
			if ((query as AuthorizationCodeQuery).code !== undefined) {
				console.log((query as AuthorizationCodeQuery).code);

				// get the Tokens using the authorization token
				const queryToken: OauthTokenResponse = await this.oauthUc.requestToken(
					(query as AuthorizationCodeQuery).code,
					systemid
				);

				// extract the uuid from the token
				const uuid = await this.oauthUc.decodeToken(queryToken.id_token);

				// get the user using the uuid
				const user: User = await this.oauthUc.findUserById(uuid);

				console.log(user);

				// create JWT for the user
				const jwt = await this.oauthUc.getJWTForUser(user);

				// TODO: redirect to Frontend
				return res.redirect('https://google.de');
			}
		} catch (exception) {
			console.log('EXCEPTION');
			console.log(exception);
			// TODO: redirect to frontend with error message
			return res.redirect('https://niedersachsen.de');
		}

		// TODO: redirect to frontend with error message
		return res.redirect('https://niedersachsen.de');
	}
}
