/**
 * @see https://www.ory.sh/docs/hydra/reference/api#tag/oAuth2
 */
export interface ProviderOidcContext {
	acr_values: string[];

	display: string;

	id_token_hint_claims: object;

	login_hint: string;

	ui_locales: string[];
}
