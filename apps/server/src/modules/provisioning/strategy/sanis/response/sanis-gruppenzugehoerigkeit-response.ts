import { IsEnum } from 'class-validator';
import { SanisGroupRole } from './sanis-group-role';

export class SanisGruppenzugehoerigkeitResponse {
	@IsEnum(SanisGroupRole, { each: true })
	rollen!: SanisGroupRole[];
}
