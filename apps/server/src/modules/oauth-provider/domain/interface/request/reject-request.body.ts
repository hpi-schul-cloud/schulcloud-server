/**
 * @see https://www.ory.sh/docs/hydra/reference/api#tag/oAuth2
 */
export interface RejectRequestBody {
	error?: string;

	error_debug?: string;

	error_description?: string;

	error_hint?: string;

	status_code?: number;
}
