import { Injectable } from '@nestjs/common';
import { ProviderRedirectResponse } from '@shared/infra/oauth-provider/dto/response/redirect.response';
import { OauthProviderService } from '@shared/infra/oauth-provider/oauth-provider.service';

@Injectable()
export class OauthProviderLogoutFlowUc {
	constructor(private readonly oauthProviderService: OauthProviderService) {}

	logoutFlow(challenge: string): Promise<ProviderRedirectResponse> {
		const logoutResponse: Promise<ProviderRedirectResponse> = this.oauthProviderService.acceptLogoutRequest(challenge);
		return logoutResponse;
	}
}
