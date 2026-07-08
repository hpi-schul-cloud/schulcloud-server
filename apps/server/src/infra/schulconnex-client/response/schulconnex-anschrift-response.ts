import { IsOptional, IsString } from 'class-validator';

export class SchulconnexAnschriftResponse {
	@IsString()
	@IsOptional()
	public ort?: string;
}
