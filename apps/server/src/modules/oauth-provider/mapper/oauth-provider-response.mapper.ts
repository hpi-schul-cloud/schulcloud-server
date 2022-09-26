import { Injectable } from '@nestjs/common';
import {
	ProviderConsentResponse,
	ProviderOauthClient,
	ProviderOidcContext,
	ProviderRedirectResponse,
} from '@shared/infra/oauth-provider/dto';
import { RedirectResponse } from '@src/modules/oauth-provider/controller/dto/response/redirect.response';
import { ConsentResponse } from '@src/modules/oauth-provider/controller/dto/response/consent.response';
import { ProviderConsentSessionResponse } from '@shared/infra/oauth-provider/dto/response/provider-consent-session.response';
import { ConsentSessionResponse } from '@src/modules/oauth-provider/controller/dto/response/consent-session.response';
import { OauthClientResponse } from '@src/modules/oauth-provider/controller/dto/response/oauth-client.response';
import { OidcContextResponse } from '@src/modules/oauth-provider/controller/dto/response/oidc-context.response';

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

	protected mapOidcContextResponse(oidcContext: ProviderOidcContext): OidcContextResponse {
		return new OidcContextResponse({ ...oidcContext });
	}

	mapConsentSessionsToResponse(session: ProviderConsentSessionResponse): ConsentSessionResponse {
		return {
			client_id: session.consent_request?.client?.client_id,
			client_name: session.consent_request?.client?.client_name,
			challenge: session.consent_request?.challenge,
		};
	}

	mapOauthClientToClientResponse(client: ProviderOauthClient): OauthClientResponse {
		return new OauthClientResponse({ ...client });
	}
}
