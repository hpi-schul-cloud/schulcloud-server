import { IsEnum, IsString } from 'class-validator';
import { SchulconnexGroupType } from './schulconnex-group-type';

export class SchulconnexGruppeResponse {
	@IsString()
	id!: string;

	@IsString()
	bezeichnung!: string;

	@IsEnum(SchulconnexGroupType)
	typ!: SchulconnexGroupType;
}
