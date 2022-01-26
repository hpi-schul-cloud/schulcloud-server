import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { OauthUc } from '../uc/oauth.uc';
import { AuthorizationQuery } from './dto/authorization.query';
import { OAuthResponse } from './dto/oauth.response';
import { OAuthResponseMapper } from './mapper/oauth-response.mapper';

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
		const dto: OAuthResponse = await this.oauthUc.startOauth(query, res, systemid);
		const response: Response = OAuthResponseMapper.mapToResponse(dto, res);
		return response.redirect(dto.redirectUri);
	}
}
