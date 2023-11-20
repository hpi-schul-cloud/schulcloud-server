// please solve this import ..please not import from modules into infra
import { IdToken } from '@modules/oauth-provider/interface/id-token';

// Is it possible to delete featherJS oauth2 ?
// Is it valid that all parameters are optional?
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
