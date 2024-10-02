import { IsString } from 'class-validator';

export class SchulconnexPoliciesInfoErrorDescriptionResponse {
	@IsString()
	code!: string;

	@IsString()
	value!: string;
}
