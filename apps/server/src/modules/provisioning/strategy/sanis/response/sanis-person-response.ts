import { SanisNameResponse } from './sanis-name-response';

export interface SanisPersonResponse {
	name: SanisNameResponse;

	geschlecht: string;

	lokalisierung: string;

	vertrauensstufe: string;
}
