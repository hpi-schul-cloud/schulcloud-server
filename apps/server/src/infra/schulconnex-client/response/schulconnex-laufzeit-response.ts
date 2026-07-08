import { IsDateString, IsOptional, Matches } from 'class-validator';

export const lernperiodeFormat = /^(\d{4})(?:-([1-2]))?$/;

export class SchulconnexLaufzeitResponse {
	@IsOptional()
	@IsDateString()
	public von?: string;

	@IsOptional()
	@IsDateString()
	public bis?: string;

	@IsOptional()
	@Matches(lernperiodeFormat)
	public vonlernperiode?: string;

	@IsOptional()
	@Matches(lernperiodeFormat)
	public bislernperiode?: string;
}
