import { ForbiddenException, Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import {
	AcceptConsentRequestBody,
	IdToken,
	ProviderConsentResponse,
	ProviderRedirectResponse,
	RejectRequestBody,
} from '../domain';
import { IdTokenService } from '../domain/service/id-token.service';
import { OauthProviderService } from '../domain/service/oauth-provider.service';
import { ConsentRequestBody } from './dto';

@Injectable()
export class OauthProviderConsentFlowUc {
	constructor(
		private readonly oauthProviderService: OauthProviderService,
		private readonly idTokenService: IdTokenService
	) {}

	public async getConsentRequest(challenge: string): Promise<ProviderConsentResponse> {
		const consentResponse: ProviderConsentResponse = await this.oauthProviderService.getConsentRequest(challenge);

		return consentResponse;
	}

	public async patchConsentRequest(
		userId: EntityId,
		challenge: string,
		accept: boolean,
		body: ConsentRequestBody
	): Promise<ProviderRedirectResponse> {
		const consentResponse: ProviderConsentResponse = await this.oauthProviderService.getConsentRequest(challenge);

		this.validateSubject(userId, consentResponse);

		let response: ProviderRedirectResponse;
		if (accept) {
			response = await this.acceptConsentRequest(
				userId,
				challenge,
				body,
				consentResponse.requested_scope,
				consentResponse.client.client_id
			);
		} else {
			response = await this.rejectConsentRequest(challenge, body);
		}

		return response;
	}

	private async rejectConsentRequest(challenge: string, body: RejectRequestBody): Promise<ProviderRedirectResponse> {
		const redirectResponse: ProviderRedirectResponse = await this.oauthProviderService.rejectConsentRequest(
			challenge,
			body
		);

		return redirectResponse;
	}

	private async acceptConsentRequest(
		userId: EntityId,
		challenge: string,
		body: AcceptConsentRequestBody,
		requested_scope: string[],
		client_id: string
	): Promise<ProviderRedirectResponse> {
		const idToken: IdToken = await this.idTokenService.createIdToken(userId, requested_scope, client_id);
		body.session = {
			id_token: idToken,
		};

		const redirectResponse: ProviderRedirectResponse = await this.oauthProviderService.acceptConsentRequest(
			challenge,
			body
		);

		return redirectResponse;
	}

	private validateSubject(userId: EntityId, response: ProviderConsentResponse): void {
		if (response.subject !== userId) {
			throw new ForbiddenException("You want to patch another user's consent");
		}
	}
}
