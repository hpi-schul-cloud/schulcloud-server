import { IsString } from 'class-validator';

export class SchulconnexPoliciesInfoErrorResponse {
	@IsString()
	code!: string;

	@IsString()
	value!: string;
}
