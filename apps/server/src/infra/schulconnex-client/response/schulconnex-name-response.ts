import { IsOptional, IsString } from 'class-validator';

export class SchulconnexNameResponse {
	@IsString()
	public familienname!: string;

	@IsString()
	public vorname!: string;

	@IsOptional()
	@IsString()
	public rufname?: string;
}
