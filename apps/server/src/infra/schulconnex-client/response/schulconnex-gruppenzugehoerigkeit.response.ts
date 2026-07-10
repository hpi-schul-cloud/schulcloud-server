import { IsArray, IsOptional, IsString } from 'class-validator';

export class SchulconnexGruppenzugehoerigkeitResponse {
	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	rollen?: string[];
}
