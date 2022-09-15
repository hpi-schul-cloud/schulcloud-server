export interface OidcContext {
	acr_values?: string[];

	display?: string;

	id_token_hint_claims?: object;

	login_hint?: string;

	ui_locales?: string[];
}
