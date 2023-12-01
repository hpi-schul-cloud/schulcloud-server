import { IsOptional, IsString } from 'class-validator';

export class SanisAnschriftResponse {
	@IsString()
	@IsOptional()
	ort?: string;
}
