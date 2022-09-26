import { Injectable } from '@nestjs/common';
import {
	ProviderConsentResponse,
	ProviderConsentSessionResponse,
	ProviderOauthClient,
	ProviderRedirectResponse,
} from '@shared/infra/oauth-provider/dto';
import {
	ConsentResponse,
	ConsentSessionResponse,
	OauthClientResponse,
	RedirectResponse,
} from '@src/modules/oauth-provider/controller/dto';

@Injectable()
export class OauthProviderResponseMapper {
	mapRedirectResponse(redirect: ProviderRedirectResponse): RedirectResponse {
		return new RedirectResponse({ ...redirect });
	}

	mapConsentResponse(consent: ProviderConsentResponse): ConsentResponse {
		return new ConsentResponse({ ...consent });
	}

	mapOauthClientResponse(oauthClient: ProviderOauthClient): OauthClientResponse {
		type ClientWithoutSecret = Omit<ProviderOauthClient, 'client_secret'>;

		return new OauthClientResponse({ ...oauthClient } as ClientWithoutSecret);
	}

	mapConsentSessionsToResponse(session: ProviderConsentSessionResponse): ConsentSessionResponse {
		return {
			client_id: session.consent_request?.client?.client_id,
			client_name: session.consent_request?.client?.client_name,
			challenge: session.consent_request?.challenge,
		};
	}
}
