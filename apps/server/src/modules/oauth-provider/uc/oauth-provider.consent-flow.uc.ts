import {
	AcceptConsentRequestBody,
	ProviderConsentResponse,
	ProviderRedirectResponse,
	RejectRequestBody,
} from '@shared/infra/oauth-provider/dto';
import { AcceptQuery } from '@src/modules/oauth-provider/controller/dto';
import { ICurrentUser } from '@shared/domain';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { IdTokenService } from '@src/modules/oauth-provider/service/id-token.service';
import { OauthProviderService } from '@shared/infra/oauth-provider';
import { IdToken } from '@src/modules/oauth-provider/interface/id-token';

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
		body: AcceptConsentRequestBody | RejectRequestBody,
		currentUser: ICurrentUser
	): Promise<ProviderRedirectResponse> {
		const consentResponse = await this.oauthProviderService.getConsentRequest(challenge);
		this.validateSubject(currentUser, consentResponse);

		if (query.accept && this.isAcceptConsentRequest(body)) {
			return this.acceptConsentRequest(
				challenge,
				body,
				currentUser.userId,
				consentResponse.requested_scope,
				consentResponse.client?.client_id
			);
		}
		const response = this.rejectConsentRequest(challenge, body as RejectRequestBody);
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
				id_token: JSON.stringify(idToken),
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

	private isAcceptConsentRequest(object: unknown): object is AcceptConsentRequestBody {
		if ((object as AcceptConsentRequestBody).grant_scope) {
			return true;
		}
		return false;
	}
}
