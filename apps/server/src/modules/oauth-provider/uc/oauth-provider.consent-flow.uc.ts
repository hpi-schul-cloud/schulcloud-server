import { OauthProviderService } from '@infra/oauth-provider';
import {
	AcceptConsentRequestBody,
	ProviderConsentResponse,
	ProviderRedirectResponse,
	RejectRequestBody,
} from '@infra/oauth-provider/dto';
import { CurrentUserInterface } from '@modules/authentication';
import { AcceptQuery, ConsentRequestBody } from '@modules/oauth-provider/controller/dto';
import { IdToken } from '@modules/oauth-provider/interface/id-token';
import { IdTokenService } from '@modules/oauth-provider/service/id-token.service';
import { ForbiddenException, Injectable } from '@nestjs/common';

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
		currentUser: CurrentUserInterface
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

	private validateSubject(currentUser: CurrentUserInterface, response: ProviderConsentResponse): void {
		if (response.subject !== currentUser.userId) {
			throw new ForbiddenException("You want to patch another user's consent");
		}
	}
}
