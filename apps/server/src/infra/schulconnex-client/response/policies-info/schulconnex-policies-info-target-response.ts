import { IsOptional, IsString } from 'class-validator';

export class SchulconnexPoliciesInfoTargetResponse {
	@IsString()
	uid!: string;

	@IsOptional()
	@IsString()
	partOf?: string;
}
