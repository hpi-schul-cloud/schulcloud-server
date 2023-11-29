import { Type } from 'class-transformer';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { SanisGruppeResponse } from './sanis-gruppe-response';
import { SanisGruppenzugehoerigkeitResponse } from './sanis-gruppenzugehoerigkeit-response';
import { SanisSonstigeGruppenzugehoerigeResponse } from './sanis-sonstige-gruppenzugehoerige-response';

export class SanisGruppenResponse {
	@ValidateNested()
	@Type(() => SanisGruppeResponse)
	gruppe!: SanisGruppeResponse;

	@ValidateNested()
	@Type(() => SanisGruppenzugehoerigkeitResponse)
	gruppenzugehoerigkeit!: SanisGruppenzugehoerigkeitResponse;

	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => SanisSonstigeGruppenzugehoerigeResponse)
	sonstige_gruppenzugehoerige?: SanisSonstigeGruppenzugehoerigeResponse[];
}
