import { Injectable } from '@nestjs/common';
import { ProviderOauthClient } from '@shared/infra/oauth-provider/dto/interface/oauth-client.interface';
import { ProviderConsentSessionResponse } from '@shared/infra/oauth-provider/dto/response/consent-session.response';
import { ProviderConsentResponse } from '@shared/infra/oauth-provider/dto/response/consent.response';
import { ProviderLoginResponse } from '@shared/infra/oauth-provider/dto/response/login.response';
import { ProviderRedirectResponse } from '@shared/infra/oauth-provider/dto/response/redirect.response';
import { ConsentSessionResponse } from '../controller/dto/response/consent-session.response';
import { ConsentResponse } from '../controller/dto/response/consent.response';
import { LoginResponse } from '../controller/dto/response/login.response';
import { OauthClientResponse } from '../controller/dto/response/oauth-client.response';
import { RedirectResponse } from '../controller/dto/response/redirect.response';

@Injectable()
export class OauthProviderResponseMapper {
	mapRedirectResponse(redirect: ProviderRedirectResponse): RedirectResponse {
		return new RedirectResponse({ ...redirect });
	}

	mapConsentResponse(consent: ProviderConsentResponse): ConsentResponse {
		return new ConsentResponse({ ...consent });
	}

	mapOauthClientResponse(oauthClient: ProviderOauthClient): OauthClientResponse {
		delete oauthClient.client_secret;
		return new OauthClientResponse({ ...oauthClient });
	}

	mapConsentSessionsToResponse(session: ProviderConsentSessionResponse): ConsentSessionResponse {
		return new ConsentSessionResponse(
			session.consent_request.client?.client_id,
			session.consent_request.client?.client_name,
			session.consent_request.challenge
		);
	}

	mapLoginResponse(providerLoginResponse: ProviderLoginResponse): LoginResponse {
		return new LoginResponse({ ...providerLoginResponse });
	}
}
