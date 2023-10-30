import { ForbiddenException, Injectable } from '@nestjs/common';
import { AcceptConsentRequestBody } from '@shared/infra/oauth-provider/dto/request/accept-consent-request.body';
import { RejectRequestBody } from '@shared/infra/oauth-provider/dto/request/reject-request.body';
import { ProviderConsentResponse } from '@shared/infra/oauth-provider/dto/response/consent.response';
import { ProviderRedirectResponse } from '@shared/infra/oauth-provider/dto/response/redirect.response';
import { OauthProviderService } from '@shared/infra/oauth-provider/oauth-provider.service';
import { ICurrentUser } from '@src/modules/authentication/interface/user';
import { AcceptQuery } from '../controller/dto/request/accept.query';
import { ConsentRequestBody } from '../controller/dto/request/consent-request.body';
import { IdToken } from '../interface/id-token';
import { IdTokenService } from '../service/id-token.service';

@Injectable()
export class OauthProviderConsentFlowUc {
	constructor(
		private readonly oauthProviderService: OauthProviderService,
		private readonly idTokenService: IdTokenService
	) {}

	async getConsentRequest(challenge: string): Promise<ProviderConsentResponse> {
		const consentResponse: ProviderConsentResponse = await this.oauthProviderService.getConsentRequest(challenge);
		return consentResponse;
	}

	async patchConsentRequest(
		challenge: string,
		query: AcceptQuery,
		body: ConsentRequestBody,
		currentUser: ICurrentUser
	): Promise<ProviderRedirectResponse> {
		const consentResponse = await this.oauthProviderService.getConsentRequest(challenge);
		this.validateSubject(currentUser, consentResponse);

		let response: Promise<ProviderRedirectResponse>;
		if (query.accept) {
			response = this.acceptConsentRequest(
				challenge,
				body,
				currentUser.userId,
				consentResponse.requested_scope,
				consentResponse.client?.client_id
			);
		} else {
			response = this.rejectConsentRequest(challenge, body);
		}
		return response;
	}

	private rejectConsentRequest(challenge: string, body: RejectRequestBody): Promise<ProviderRedirectResponse> {
		const redirectResponse: Promise<ProviderRedirectResponse> = this.oauthProviderService.rejectConsentRequest(
			challenge,
			body
		);
		return redirectResponse;
	}

	private async acceptConsentRequest(
		challenge: string,
		body: AcceptConsentRequestBody,
		userId: string,
		requested_scope: string[] | undefined,
		client_id: string | undefined
	): Promise<ProviderRedirectResponse> {
		const idToken: IdToken = await this.idTokenService.createIdToken(userId, requested_scope || [], client_id || '');
		if (idToken) {
			body.session = {
				id_token: idToken,
			};
		}

		const redirectResponse: ProviderRedirectResponse = await this.oauthProviderService.acceptConsentRequest(
			challenge,
			body
		);

		return redirectResponse;
	}

	private validateSubject(currentUser: ICurrentUser, response: ProviderConsentResponse): void {
		if (response.subject !== currentUser.userId) {
			throw new ForbiddenException("You want to patch another user's consent");
		}
	}
}
