import { IsEnum, IsString } from 'class-validator';
import { SanisGroupRole } from './sanis-group-role';

export class SanisSonstigeGruppenzugehoerigeResponse {
	@IsString()
	ktid!: string;

	@IsEnum(SanisGroupRole, { each: true })
	rollen!: SanisGroupRole[];
}
