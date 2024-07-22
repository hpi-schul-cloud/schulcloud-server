import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { SchulconnexGroupRole } from './schulconnex-group-role';

export class SchulconnexSonstigeGruppenzugehoerigeResponse {
	@IsString()
	ktid!: string;

	@IsOptional()
	@IsArray()
	@IsEnum(SchulconnexGroupRole, { each: true })
	rollen?: SchulconnexGroupRole[];
}
