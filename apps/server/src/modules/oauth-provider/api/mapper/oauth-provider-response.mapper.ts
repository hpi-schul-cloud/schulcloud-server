import { Injectable } from '@nestjs/common';
import {
	ProviderConsentResponse,
	ProviderConsentSessionResponse,
	ProviderLoginResponse,
	ProviderOauthClient,
	ProviderRedirectResponse,
} from '../../domain';
import { ConsentResponse, ConsentSessionResponse, LoginResponse, OauthClientResponse, RedirectResponse } from '../dto';

@Injectable()
export class OauthProviderResponseMapper {
	public static mapRedirectResponse(redirect: ProviderRedirectResponse): RedirectResponse {
		const response: RedirectResponse = new RedirectResponse({ ...redirect });

		return response;
	}

	public static mapConsentResponse(consent: ProviderConsentResponse): ConsentResponse {
		const response: ConsentResponse = new ConsentResponse({ ...consent });

		return response;
	}

	public static mapOauthClientResponse(oauthClient: ProviderOauthClient): OauthClientResponse {
		delete oauthClient.client_secret;

		const response: OauthClientResponse = new OauthClientResponse({ ...oauthClient });

		return response;
	}

	public static mapConsentSessionsToResponse(session: ProviderConsentSessionResponse): ConsentSessionResponse {
		const response: ConsentSessionResponse = new ConsentSessionResponse({
			client_id: session.consent_request.client.client_id,
			client_name: session.consent_request.client.client_name,
			challenge: session.consent_request.challenge,
		});

		return response;
	}

	public static mapLoginResponse(providerLoginResponse: ProviderLoginResponse): LoginResponse {
		const response: LoginResponse = new LoginResponse({
			client_id: providerLoginResponse.client.client_id,
			...providerLoginResponse,
		});

		return response;
	}
}
