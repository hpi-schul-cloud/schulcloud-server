import { IsArray, IsOptional, IsString } from 'class-validator';
import { SchulconnexGroupRole } from './schulconnex-group-role';

export class SchulconnexSonstigeGruppenzugehoerigeResponse {
	@IsString()
	ktid!: string;

	@IsOptional()
	@IsArray()
	rollen?: SchulconnexGroupRole[];
}
