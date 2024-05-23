import { Type } from 'class-transformer';
import { IsObject, IsOptional, ValidateNested } from 'class-validator';
import { SchulconnexGeburtResponse } from './schulconnex-geburt-response';
import { SchulconnexNameResponse } from './schulconnex-name-response';

export class SchulconnexPersonResponse {
	@IsObject()
	@ValidateNested()
	@Type(() => SchulconnexNameResponse)
	name!: SchulconnexNameResponse;

	@IsOptional()
	@IsObject()
	@ValidateNested()
	@Type(() => SchulconnexGeburtResponse)
	geburt?: SchulconnexGeburtResponse;
}
