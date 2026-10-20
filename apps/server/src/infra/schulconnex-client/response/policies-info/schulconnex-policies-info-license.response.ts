import { Type } from 'class-transformer';
import { IsArray, IsObject, IsOptional, ValidateNested } from 'class-validator';
import { SchulconnexPoliciesInfoLicenseAccessControlResponse } from './schulconnex-policies-info-access-control.response';
import { SchulconnexPoliciesInfoPermissionResponse } from './schulconnex-policies-info-permission.response';
import { SchulconnexPoliciesInfoPolicyResponse } from './schulconnex-policies-info-policy.response';
import { SchulconnexPoliciesInfoTargetResponse } from './schulconnex-policies-info-target.response';

export class SchulconnexPoliciesInfoLicenseResponse {
	@IsOptional()
	@IsObject()
	@ValidateNested()
	@Type(() => SchulconnexPoliciesInfoPolicyResponse)
	policy?: SchulconnexPoliciesInfoPolicyResponse;

	@IsOptional()
	@IsObject()
	@ValidateNested()
	@Type(() => SchulconnexPoliciesInfoLicenseAccessControlResponse)
	access_control?: SchulconnexPoliciesInfoLicenseAccessControlResponse;

	@IsOptional()
	@IsObject()
	@ValidateNested()
	@Type(() => SchulconnexPoliciesInfoTargetResponse)
	target?: SchulconnexPoliciesInfoTargetResponse;

	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => SchulconnexPoliciesInfoPermissionResponse)
	permission?: SchulconnexPoliciesInfoPermissionResponse[];
}
