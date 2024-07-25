import { Type } from 'class-transformer';
import { IsArray, IsObject, ValidateNested } from 'class-validator';
import { SchulconnexPoliciesInfoPermissionResponse } from './schulconnex-policies-info-permission-response';
import { SchulconnexPoliciesInfoTargetResponse } from './schulconnex-policies-info-target-response';

export class SchulconnexPoliciesInfoResponse {
	@IsObject()
	@ValidateNested({ each: true })
	@Type(() => SchulconnexPoliciesInfoTargetResponse)
	target!: SchulconnexPoliciesInfoTargetResponse;

	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => SchulconnexPoliciesInfoPermissionResponse)
	permission!: SchulconnexPoliciesInfoPermissionResponse[];
}
