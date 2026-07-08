import { Type } from 'class-transformer';
import { IsArray, IsObject, IsOptional, ValidateNested } from 'class-validator';
import { SchulconnexGruppeResponse } from './schulconnex-gruppe-response';
import { SchulconnexGruppenzugehoerigkeitResponse } from './schulconnex-gruppenzugehoerigkeit-response';
import { SchulconnexSonstigeGruppenzugehoerigeResponse } from './schulconnex-sonstige-gruppenzugehoerige-response';

export class SchulconnexGruppenResponse {
	@IsObject()
	@ValidateNested()
	@Type(() => SchulconnexGruppeResponse)
	public gruppe!: SchulconnexGruppeResponse;

	@IsObject()
	@ValidateNested()
	@Type(() => SchulconnexGruppenzugehoerigkeitResponse)
	public gruppenzugehoerigkeit!: SchulconnexGruppenzugehoerigkeitResponse;

	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => SchulconnexSonstigeGruppenzugehoerigeResponse)
	public sonstige_gruppenzugehoerige?: SchulconnexSonstigeGruppenzugehoerigeResponse[];
}
