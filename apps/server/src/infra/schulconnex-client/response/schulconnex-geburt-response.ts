import { IsOptional, IsString } from 'class-validator';

export class SchulconnexGeburtResponse {
	@IsOptional()
	@IsString()
	datum?: string;
}
