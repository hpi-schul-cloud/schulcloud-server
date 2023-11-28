import { SanisGeburtResponse } from './sanis-geburt-response';
import { SanisNameResponse } from './sanis-name-response';

export interface SanisPersonResponse {
	name?: SanisNameResponse;

	geburt?: SanisGeburtResponse;

	geschlecht?: string;

	lokalisierung?: string;

	vertrauensstufe?: string;
}
