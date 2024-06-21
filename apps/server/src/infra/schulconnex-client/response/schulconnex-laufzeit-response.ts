import { IsDate, IsOptional, IsString } from 'class-validator';

export class SchulconnexLaufzeitResponse {
	@IsOptional()
	@IsDate()
	von?: Date;

	@IsOptional()
	@IsDate()
	bis?: Date;

	@IsOptional()
	@IsString()
	vonlernperiode?: string;

	@IsOptional()
	@IsString()
	bislernperiode?: string;
}
