import { SanisGroupType } from './sanis-group-type';
import { SanisLaufzeitResponse } from './sanis-laufzeit-response';

export interface SanisGruppeResponse {
	id: string;

	bezeichnung: string;

	typ: SanisGroupType;

	orgid: string;

	laufzeit: SanisLaufzeitResponse;
}
