import { SanisPersonResponse } from './sanis-person-response';
import { SanisPersonenkontextResponse } from './sanis-personenkontext-response';

export interface SanisResponse {
	pid: string;

	person: SanisPersonResponse;

	personenkontexte: SanisPersonenkontextResponse[];
}
