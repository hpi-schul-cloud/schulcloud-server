import { IsOptional, IsString } from 'class-validator';

export class SchulconnexLizenzInfoTargetResponse {
	@IsString()
	uid!: string;

	@IsOptional()
	@IsString()
	partOf?: string;
}
