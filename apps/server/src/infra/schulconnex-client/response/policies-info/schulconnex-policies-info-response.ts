import {
	SchulconnexPoliciesInfoErrorResponse,
	SchulconnexPoliciesInfoLicenseResponse,
} from '@infra/schulconnex-client';
import { PolymorphicArrayTransform } from '@shared/controller/transformer/polymorphic-array.transformer';
import { ClassConstructor } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';

const policiesInfoDiscriminator = (
	obj: unknown
): ClassConstructor<SchulconnexPoliciesInfoLicenseResponse | SchulconnexPoliciesInfoErrorResponse> =>
	typeof obj === 'object' && obj !== null && 'target' in obj && 'permission' in obj
		? SchulconnexPoliciesInfoLicenseResponse
		: SchulconnexPoliciesInfoErrorResponse;

export class SchulconnexPoliciesInfoResponse {
	@IsArray()
	@ValidateNested({ each: true })
	@PolymorphicArrayTransform(policiesInfoDiscriminator)
	data!: (SchulconnexPoliciesInfoLicenseResponse | SchulconnexPoliciesInfoErrorResponse)[];
}
