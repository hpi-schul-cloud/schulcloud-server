import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { SanisGroupRole } from './sanis-group-role';

export class SanisSonstigeGruppenzugehoerigeResponse {
	@IsString()
	ktid!: string;

	@IsOptional()
	@IsArray()
	@IsEnum(SanisGroupRole, { each: true })
	rollen?: SanisGroupRole[];
}
