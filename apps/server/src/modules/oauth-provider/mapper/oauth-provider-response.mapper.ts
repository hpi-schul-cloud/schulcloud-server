import { Injectable } from '@nestjs/common';
import { ProviderConsentSessionResponse } from '@shared/infra/oauth-provider/dto/response/provider-consent-session.response';
import { ConsentSessionResponse } from '@src/modules/oauth-provider/controller/dto/response/consent-session.response';

@Injectable()
export class OauthProviderResponseMapper {
	mapConsentSessionsToResponse(session: ProviderConsentSessionResponse): ConsentSessionResponse {
		return {
			client_id: session.consent_request?.client?.client_id,
			client_name: session.consent_request?.client?.client_name,
			challenge: session.consent_request?.challenge,
		};
	}
}
