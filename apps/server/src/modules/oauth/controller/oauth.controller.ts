import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { OauthUc } from '../uc/oauth.uc';
import { AuthorizationQuery } from './dto/authorization.query';

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
		const response = await this.oauthUc.startOauth(query, res, systemid);
		// TODO: mapping and then return res maybe?
		return response;
	}
}
