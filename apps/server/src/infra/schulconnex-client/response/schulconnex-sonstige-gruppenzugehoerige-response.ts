import { IsArray, IsOptional, IsString } from 'class-validator';

export class SchulconnexSonstigeGruppenzugehoerigeResponse {
	@IsString()
	public ktid!: string;

	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	public rollen?: string[];
}
