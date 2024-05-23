import { IsArray, IsEnum, IsOptional } from 'class-validator';
import { SchulconnexGroupRole } from './schulconnex-group-role';

export class SchulconnexGruppenzugehoerigkeitResponse {
	@IsOptional()
	@IsArray()
	@IsEnum(SchulconnexGroupRole, { each: true })
	rollen?: SchulconnexGroupRole[];
}
