export const ARIX_REST_CLIENT_OPTIONS = Symbol('ARIX_REST_CLIENT_OPTIONS');

export interface ArixRestClientOptions {
	apiUrl: string;

	user: string;

	password: string;

	withController?: boolean;
}
