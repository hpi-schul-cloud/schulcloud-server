import { IsOptional, IsString } from 'class-validator';

export class SchulconnexAnschriftResponse {
	@IsString()
	@IsOptional()
	ort?: string;
}
