import { Type } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';
import { SanisGeburtResponse } from './sanis-geburt-response';
import { SanisNameResponse } from './sanis-name-response';

export class SanisPersonResponse {
	@ValidateNested()
	@Type(() => SanisNameResponse)
	name!: SanisNameResponse;

	@IsOptional()
	@ValidateNested()
	@Type(() => SanisGeburtResponse)
	geburt?: SanisGeburtResponse;
}
