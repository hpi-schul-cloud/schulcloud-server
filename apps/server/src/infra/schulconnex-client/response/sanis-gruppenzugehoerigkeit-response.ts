import { IsArray, IsEnum, IsOptional } from 'class-validator';
import { SanisGroupRole } from './sanis-group-role';

export class SanisGruppenzugehoerigkeitResponse {
	@IsOptional()
	@IsArray()
	@IsEnum(SanisGroupRole, { each: true })
	rollen?: SanisGroupRole[];
}
