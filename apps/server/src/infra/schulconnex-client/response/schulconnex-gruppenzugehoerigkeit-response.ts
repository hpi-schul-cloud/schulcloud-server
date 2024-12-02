import { IsArray, IsOptional } from 'class-validator';
import { SchulconnexGroupRole } from './schulconnex-group-role';

export class SchulconnexGruppenzugehoerigkeitResponse {
	@IsOptional()
	@IsArray()
	rollen?: SchulconnexGroupRole[];
}
