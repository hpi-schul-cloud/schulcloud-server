import { SchulconnexPoliciesInfoAccessControlResponse } from '@infra/schulconnex-client';
import { Type } from 'class-transformer';
import { IsObject, ValidateNested } from 'class-validator';

export class SchulconnexPoliciesInfoErrorResponse {
	@IsObject()
	@ValidateNested()
	@Type(() => SchulconnexPoliciesInfoAccessControlResponse)
	access_control!: SchulconnexPoliciesInfoAccessControlResponse;
}
