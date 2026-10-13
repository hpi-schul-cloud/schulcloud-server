import { PolymorphicArrayTransform } from '@shared/controller/transformer';
import { ClassConstructor } from 'class-transformer';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { SchulconnexPoliciesInfoErrorResponse } from './schulconnex-policies-info-error.response';
import { SchulconnexPoliciesInfoLicenseResponse } from './schulconnex-policies-info-license.response';

const policiesInfoDiscriminator = (
	obj: unknown
): ClassConstructor<SchulconnexPoliciesInfoLicenseResponse | SchulconnexPoliciesInfoErrorResponse> =>
	typeof obj === 'object' && obj !== null && ('policy' in obj || ('target' in obj && 'permission' in obj))
		? SchulconnexPoliciesInfoLicenseResponse
		: SchulconnexPoliciesInfoErrorResponse;

export class SchulconnexPoliciesInfoResponse {
	@IsOptional()
	@IsString()
	pid?: string;

	@IsArray()
	@ValidateNested({ each: true })
	@PolymorphicArrayTransform(policiesInfoDiscriminator)
	data!: (SchulconnexPoliciesInfoLicenseResponse | SchulconnexPoliciesInfoErrorResponse)[];

	@IsOptional()
	@IsArray()
	status?: unknown[];
}
