import { ProviderConsentResponse } from './consent.response';

/**
 * @see https://www.ory.sh/docs/hydra/reference/api#tag/oAuth2
 */
export interface ProviderConsentSessionResponse {
	consent_request: ProviderConsentResponse;

	grant_access_token_audience: string[];

	grant_scope: string[];

	handled_at: string;

	remember: boolean;

	remember_for: number;

	session: {
		access_token: string;

		id_token: string;
	};
}
