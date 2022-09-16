import { Injectable } from '@nestjs/common';
import { OauthProviderService } from '@shared/infra/oauth-provider/index';
import { RedirectResponse } from '@shared/infra/oauth-provider/dto';

@Injectable()
export class OauthProviderUc {
	constructor(private readonly oauthProviderService: OauthProviderService) {}

	logoutFlow(challenge: string): Promise<RedirectResponse> {
		const logout = this.oauthProviderService.acceptLogoutRequest(challenge);
		return logout;
	}
}
