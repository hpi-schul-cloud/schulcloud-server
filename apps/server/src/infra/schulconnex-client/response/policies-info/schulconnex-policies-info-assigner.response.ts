import { IsOptional, IsString } from 'class-validator';

export class SchulconnexPoliciesInfoAssignerResponse {
	@IsString()
	uid!: string;

	@IsOptional()
	@IsString()
	partOf?: string;
}
