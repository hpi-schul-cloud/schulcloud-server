import { Injectable } from '@nestjs/common';
import { OauthProviderService } from '@shared/infra/oauth-provider';
import { ConsentResponse, ProviderRedirectResponse, RejectRequestBody } from '@shared/infra/oauth-provider/dto';
import { AcceptQuery, ConsentRequestBody } from '@src/modules/oauth-provider/controller/dto';

@Injectable()
export class OauthProviderUc {
	constructor(private readonly oauthProviderService: OauthProviderService) {}

	getConsentRequest(challenge: string): Promise<ConsentResponse> {
		const consentRequest = this.oauthProviderService.getConsentRequest(challenge);
		return consentRequest;
	}

	patchConsentRequest(
		challenge: string,
		query: AcceptQuery,
		body: ConsentRequestBody | RejectRequestBody
	): Promise<ProviderRedirectResponse> {
		const responsePromise: Promise<ProviderRedirectResponse> = query.accept
			? this.oauthProviderService.acceptConsentRequest(challenge, body as ConsentRequestBody)
			: this.oauthProviderService.rejectConsentRequest(challenge, body as RejectRequestBody);
		return responsePromise;
	}
}
