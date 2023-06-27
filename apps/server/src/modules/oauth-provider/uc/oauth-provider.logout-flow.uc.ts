import { Injectable } from '@nestjs/common';
import { OauthProviderService } from '@shared/infra/oauth-provider';
import { ProviderRedirectResponse } from '@shared/infra/oauth-provider/dto';

@Injectable()
export class OauthProviderLogoutFlowUc {
	constructor(private readonly oauthProviderService: OauthProviderService) {}

	logoutFlow(challenge: string): Promise<ProviderRedirectResponse> {
		const logoutResponse: Promise<ProviderRedirectResponse> = this.oauthProviderService.acceptLogoutRequest(challenge);
		return logoutResponse;
	}
}
