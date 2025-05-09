import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
import { Controller, Get } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { OAuthSessionTokenExpirationResponse } from './dto';
import { OAuthSessionTokenMapper } from './mapper';
import { OAuthUc } from './oauth.uc';

@ApiTags('OAuth')
@JwtAuthentication()
@Controller('oauth')
export class OAuthController {
	constructor(private readonly oauthUc: OAuthUc) {}

	@ApiOperation({ summary: 'Get the expiration date of the current oauth session token of the user' })
	@ApiNotFoundResponse()
	@Get('/session-token/expiration')
	public async getSessionTokenExpiration(
		@CurrentUser() user: ICurrentUser
	): Promise<OAuthSessionTokenExpirationResponse> {
		const sessionToken = await this.oauthUc.getLatestSessionTokenByUser(user.userId);

		const response = OAuthSessionTokenMapper.mapToExpirationResponse(sessionToken);

		return response;
	}
}
