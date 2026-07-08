import { IsOptional, IsString } from 'class-validator';

export class SchulconnexGeburtResponse {
	@IsOptional()
	@IsString()
	public datum?: string;
}
