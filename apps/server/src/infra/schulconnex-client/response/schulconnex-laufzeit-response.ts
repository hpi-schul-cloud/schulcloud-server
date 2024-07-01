import { IsDateString, IsOptional, Matches } from 'class-validator';

export const lernperiodeFormat = /^(\d{4})(?:-([1-2]))?$/;

export class SchulconnexLaufzeitResponse {
	@IsOptional()
	@IsDateString()
	von?: string;

	@IsOptional()
	@IsDateString()
	bis?: string;

	@IsOptional()
	@Matches(lernperiodeFormat)
	vonlernperiode?: string;

	@IsOptional()
	@Matches(lernperiodeFormat)
	bislernperiode?: string;
}
