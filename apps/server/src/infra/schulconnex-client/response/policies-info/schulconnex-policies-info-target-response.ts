import { IsOptional, IsString } from 'class-validator';

export class SchulconnexPoliciesInfoTargetResponse {
	@IsString()
	public uid!: string;

	@IsOptional()
	@IsString()
	public partOf?: string;
}
