import { Injectable } from '@nestjs/common';
import { ProviderRedirectResponse } from '../domain';
import { OauthProviderService } from '../domain/service/oauth-provider.service';

@Injectable()
export class OauthProviderLogoutFlowUc {
	constructor(private readonly oauthProviderService: OauthProviderService) {}

	public async logoutFlow(challenge: string): Promise<ProviderRedirectResponse> {
		const logoutResponse: ProviderRedirectResponse = await this.oauthProviderService.acceptLogoutRequest(challenge);

		return logoutResponse;
	}
}
