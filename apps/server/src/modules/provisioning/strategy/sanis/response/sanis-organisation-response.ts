import { SanisAnschriftResponse } from './sanis-anschrift-response';

export interface SanisOrganisationResponse {
	id: string;

	kennung: string;

	name: string;

	typ: string;

	anschrift?: SanisAnschriftResponse;
}
