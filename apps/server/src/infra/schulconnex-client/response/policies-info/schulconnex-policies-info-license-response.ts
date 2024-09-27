import {
	SchulconnexPoliciesInfoPermissionResponse,
	SchulconnexPoliciesInfoTargetResponse,
} from '@infra/schulconnex-client';
import { Type } from 'class-transformer';
import { IsArray, IsObject, ValidateNested } from 'class-validator';

export class SchulconnexPoliciesInfoLicenseResponse {
	@IsObject()
	@ValidateNested()
	@Type(() => SchulconnexPoliciesInfoTargetResponse)
	target!: SchulconnexPoliciesInfoTargetResponse;

	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => SchulconnexPoliciesInfoPermissionResponse)
	permission!: SchulconnexPoliciesInfoPermissionResponse[];
}
