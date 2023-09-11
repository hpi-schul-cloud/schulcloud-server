import { SanisGruppeResponse } from './sanis-gruppe-response';
import { SanisGruppenzugehoerigkeitResponse } from './sanis-gruppenzugehoerigkeit-response';
import { SanisSonstigeGruppenzugehoerigeResponse } from './sanis-sonstige-gruppenzugehoerige-response';

export interface SanisGruppenResponse {
	gruppe: SanisGruppeResponse;

	gruppenzugehoerigkeit: SanisGruppenzugehoerigkeitResponse;

	sonstige_gruppenzugehoerige?: SanisSonstigeGruppenzugehoerigeResponse[];
}
