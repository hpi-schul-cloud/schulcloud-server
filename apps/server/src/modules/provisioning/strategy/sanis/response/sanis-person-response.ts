import { Type } from 'class-transformer';
import { IsObject, IsOptional, ValidateNested } from 'class-validator';
import { SanisGeburtResponse } from './sanis-geburt-response';
import { SanisNameResponse } from './sanis-name-response';

export class SanisPersonResponse {
	@IsObject()
	@ValidateNested()
	@Type(() => SanisNameResponse)
	name!: SanisNameResponse;

	@IsOptional()
	@IsObject()
	@ValidateNested()
	@Type(() => SanisGeburtResponse)
	geburt?: SanisGeburtResponse;
}
