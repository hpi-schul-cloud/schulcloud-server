import { SanisRole } from './sanis-role';
import { SanisGruppenResponse } from './sanis-gruppen-response';
import { SanisOrganisationResponse } from './sanis-organisation-response';

export interface SanisPersonenkontextResponse {
	id: string;

	rolle: SanisRole;

	organisation: SanisOrganisationResponse;

	personenstatus: string;

	gruppen: SanisGruppenResponse[];
}
