import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
import { Controller, Get } from '@nestjs/common';
import { ApiForbiddenResponse, ApiNotFoundResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { OAuthSessionTokenExpirationResponse } from './dto';
import { OAuthSessionTokenMapper } from './mapper';
import { OAuthUc } from './oauth.uc';

@ApiTags('OAuth')
@JwtAuthentication()
@Controller('oauth')
export class OAuthController {
	constructor(private readonly oauthUc: OAuthUc) {}

	@ApiOperation({ summary: 'Get the expiration date of the current oauth session token of the user' })
	@ApiNotFoundResponse({ description: 'User has no oauth session token or the token had expired' })
	@ApiForbiddenResponse({ description: 'The feature flag for external system logout is not enabled' })
	@Get('/session-token/expiration')
	public async getSessionTokenExpiration(
		@CurrentUser() user: ICurrentUser
	): Promise<OAuthSessionTokenExpirationResponse> {
		const sessionToken = await this.oauthUc.getLatestSessionTokenByUser(user.userId);

		const response = OAuthSessionTokenMapper.mapToExpirationResponse(sessionToken);

		return response;
	}
}
