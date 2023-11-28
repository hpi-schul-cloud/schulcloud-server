import { IsEnum, IsString } from 'class-validator';
import { SanisGroupType } from './sanis-group-type';

export class SanisGruppeResponse {
	@IsString()
	id!: string;

	@IsString()
	bezeichnung!: string;

	@IsEnum(SanisGroupType)
	typ!: SanisGroupType;
}
