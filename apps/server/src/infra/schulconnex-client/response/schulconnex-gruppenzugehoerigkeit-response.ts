import { IsArray, IsOptional, IsString } from 'class-validator';

export class SchulconnexGruppenzugehoerigkeitResponse {
	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	public rollen?: string[];
}
