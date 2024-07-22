import { Type } from 'class-transformer';
import { IsEnum, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { SchulconnexGroupType } from './schulconnex-group-type';
import { SchulconnexLaufzeitResponse } from './schulconnex-laufzeit-response';

export class SchulconnexGruppeResponse {
	@IsString()
	id!: string;

	@IsString()
	bezeichnung!: string;

	@IsEnum(SchulconnexGroupType)
	typ!: SchulconnexGroupType;

	@IsOptional()
	@IsObject()
	@ValidateNested()
	@Type(() => SchulconnexLaufzeitResponse)
	laufzeit?: SchulconnexLaufzeitResponse;
}
