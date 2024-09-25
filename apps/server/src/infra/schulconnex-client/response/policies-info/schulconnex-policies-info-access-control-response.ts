import { SchulconnexPoliciesInfoErrorResponse } from '@infra/schulconnex-client/response/policies-info/schulconnex-policies-info-error-response';
import { Type } from 'class-transformer';
import { IsObject, IsString, ValidateNested } from 'class-validator';

export class SchulconnexPoliciesInfoAccessControlResponse {
	@IsString()
	'@type'!: string;

	@IsObject()
	@ValidateNested()
	@Type(() => SchulconnexPoliciesInfoErrorResponse)
	error!: SchulconnexPoliciesInfoErrorResponse;
}
