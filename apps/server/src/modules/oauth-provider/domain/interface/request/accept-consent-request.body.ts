import { IdToken } from '../id-token';

/**
 * @see https://www.ory.sh/docs/hydra/reference/api#tag/oAuth2
 */
export interface AcceptConsentRequestBody {
	grant_access_token_audience?: string[];

	grant_scope?: string[];

	handled_at?: string;

	remember?: boolean;

	remember_for?: number;

	session?: {
		access_token?: string;

		id_token?: IdToken;
	};
}
