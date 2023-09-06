import { SanisGruppeResponse } from './sanis-gruppe-response';
import { SanisGruppenzugehoerigkeitResponse } from './sanis-gruppenzugehoerigkeit-response';

export interface SanisGruppenResponse {
	gruppe: SanisGruppeResponse;

	gruppenzugehoerigkeiten: SanisGruppenzugehoerigkeitResponse[];
}
