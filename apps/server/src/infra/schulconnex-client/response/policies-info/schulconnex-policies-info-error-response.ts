import { Type } from 'class-transformer';
import { IsObject, ValidateNested } from 'class-validator';
import { SchulconnexPoliciesInfoAccessControlResponse } from './schulconnex-policies-info-access-control-response';

export class SchulconnexPoliciesInfoErrorResponse {
	@IsObject()
	@ValidateNested()
	@Type(() => SchulconnexPoliciesInfoAccessControlResponse)
	public access_control!: SchulconnexPoliciesInfoAccessControlResponse;
}
