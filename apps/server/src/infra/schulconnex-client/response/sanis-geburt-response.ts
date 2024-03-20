import { IsOptional, IsString } from 'class-validator';

export class SanisGeburtResponse {
	@IsOptional()
	@IsString()
	datum?: string;
}
