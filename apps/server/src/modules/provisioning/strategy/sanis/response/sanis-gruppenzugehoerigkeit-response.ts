import { SanisGroupRole } from './sanis-group-role';

export interface SanisGruppenzugehoerigkeitResponse {
	rollen: SanisGroupRole[];

	id: string;

	ktid: string;

	von: Date;

	bis: Date;
}
