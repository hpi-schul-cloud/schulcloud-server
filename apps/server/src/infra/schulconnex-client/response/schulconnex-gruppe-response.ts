import { Type } from 'class-transformer';
import { IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { SchulconnexLaufzeitResponse } from './schulconnex-laufzeit-response';

export class SchulconnexGruppeResponse {
	@IsString()
	id!: string;

	@IsString()
	bezeichnung!: string;

	@IsString()
	typ!: string;

	@IsOptional()
	@IsObject()
	@ValidateNested()
	@Type(() => SchulconnexLaufzeitResponse)
	laufzeit?: SchulconnexLaufzeitResponse;
}
