import { Type } from 'class-transformer';
import { IsArray, IsObject, IsOptional, ValidateNested } from 'class-validator';
import { SanisGruppeResponse } from './sanis-gruppe-response';
import { SanisGruppenzugehoerigkeitResponse } from './sanis-gruppenzugehoerigkeit-response';
import { SanisSonstigeGruppenzugehoerigeResponse } from './sanis-sonstige-gruppenzugehoerige-response';

export class SanisGruppenResponse {
	@IsObject()
	@ValidateNested()
	@Type(() => SanisGruppeResponse)
	gruppe!: SanisGruppeResponse;

	@IsObject()
	@ValidateNested()
	@Type(() => SanisGruppenzugehoerigkeitResponse)
	gruppenzugehoerigkeit!: SanisGruppenzugehoerigkeitResponse;

	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => SanisSonstigeGruppenzugehoerigeResponse)
	sonstige_gruppenzugehoerige?: SanisSonstigeGruppenzugehoerigeResponse[];
}
