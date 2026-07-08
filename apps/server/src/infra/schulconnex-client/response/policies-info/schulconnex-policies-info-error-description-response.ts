import { IsString } from 'class-validator';

export class SchulconnexPoliciesInfoErrorDescriptionResponse {
	@IsString()
	public code!: string;

	@IsString()
	public value!: string;
}
