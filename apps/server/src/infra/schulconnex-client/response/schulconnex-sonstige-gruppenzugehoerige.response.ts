import { IsArray, IsOptional, IsString } from 'class-validator';

export class SchulconnexSonstigeGruppenzugehoerigeResponse {
	@IsString()
	ktid!: string;

	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	rollen?: string[];
}
