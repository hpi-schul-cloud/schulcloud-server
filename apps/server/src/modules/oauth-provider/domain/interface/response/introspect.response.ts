/**
 * @see https://www.ory.sh/docs/hydra/reference/api#tag/oAuth2
 */
export interface IntrospectResponse {
	active: boolean;

	aud: string[];

	client_id: string;

	exp: number;

	ext: object;

	iat: number;

	iss: string;

	nbf: number;

	obfuscated_subject: string;

	scope: string;

	sub: string;

	token_type: string;

	token_use: string;

	username: string;
}
