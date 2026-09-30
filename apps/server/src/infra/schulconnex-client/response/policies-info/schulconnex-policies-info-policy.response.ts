import { Type } from 'class-transformer';
import { IsArray, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { SchulconnexPoliciesInfoAssignerResponse } from './schulconnex-policies-info-assigner.response';
import { SchulconnexPoliciesInfoPermissionResponse } from './schulconnex-policies-info-permission.response';
import { SchulconnexPoliciesInfoTargetResponse } from './schulconnex-policies-info-target.response';

export class SchulconnexPoliciesInfoPolicyResponse {
	@IsOptional()
	@IsString()
	uid?: string;

	@IsOptional()
	@IsObject()
	@ValidateNested()
	@Type(() => SchulconnexPoliciesInfoTargetResponse)
	target?: SchulconnexPoliciesInfoTargetResponse;

	@IsOptional()
	@IsObject()
	@ValidateNested()
	@Type(() => SchulconnexPoliciesInfoAssignerResponse)
	assigner?: SchulconnexPoliciesInfoAssignerResponse;

	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => SchulconnexPoliciesInfoPermissionResponse)
	permission?: SchulconnexPoliciesInfoPermissionResponse[];
}
