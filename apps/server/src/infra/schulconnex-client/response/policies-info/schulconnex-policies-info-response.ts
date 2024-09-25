import { SchulconnexPoliciesInfoAccessControlResponse } from '@infra/schulconnex-client/response/policies-info/schulconnex-policies-info-access-control-response';
import { Type } from 'class-transformer';
import { IsArray, IsObject, IsOptional, ValidateNested } from 'class-validator';
import { SchulconnexPoliciesInfoPermissionResponse } from './schulconnex-policies-info-permission-response';
import { SchulconnexPoliciesInfoTargetResponse } from './schulconnex-policies-info-target-response';

export class SchulconnexPoliciesInfoResponse {
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

	@IsOptional()
	@IsObject()
	@ValidateNested()
	@Type(() => SchulconnexPoliciesInfoAccessControlResponse)
	access_control?: SchulconnexPoliciesInfoAccessControlResponse;
}
