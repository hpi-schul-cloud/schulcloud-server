import { Type } from 'class-transformer';
import { IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { SchulconnexLaufzeitResponse } from './schulconnex-laufzeit-response';

export class SchulconnexGruppeResponse {
	@IsString()
	public id!: string;

	@IsString()
	public bezeichnung!: string;

	@IsString()
	public typ!: string;

	@IsOptional()
	@IsObject()
	@ValidateNested()
	@Type(() => SchulconnexLaufzeitResponse)
	public laufzeit?: SchulconnexLaufzeitResponse;
}
