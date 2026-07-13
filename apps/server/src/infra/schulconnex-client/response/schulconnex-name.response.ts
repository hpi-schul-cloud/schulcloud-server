import { IsOptional, IsString } from 'class-validator';

export class SchulconnexNameResponse {
	@IsString()
	familienname!: string;

	@IsString()
	vorname!: string;

	@IsOptional()
	@IsString()
	rufname?: string;
}
