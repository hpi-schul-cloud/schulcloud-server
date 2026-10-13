import { Transform, Type } from 'class-transformer';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { SchulconnexPoliciesInfoActionType } from './schulconnex-policies-info-action-type';

export class SchulconnexPoliciesInfoRefinementResponse {
	@IsString()
	leftOperand!: string;

	@IsString()
	operator!: string;

	@IsString()
	rightOperand!: string;
}

export class SchulconnexPoliciesInfoAssigneeResponse {
	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => SchulconnexPoliciesInfoRefinementResponse)
	refinement?: SchulconnexPoliciesInfoRefinementResponse[];
}

export class SchulconnexPoliciesInfoPermissionResponse {
	@IsOptional()
	@Transform(({ value }: { value: unknown }) => {
		if (value === undefined || value === null) {
			return [];
		}
		return (Array.isArray(value) ? value : [value]) as string[];
	})
	@IsArray()
	@IsString({ each: true })
	action!: (SchulconnexPoliciesInfoActionType | string)[];

	@IsOptional()
	@ValidateNested()
	@Type(() => SchulconnexPoliciesInfoAssigneeResponse)
	assignee?: SchulconnexPoliciesInfoAssigneeResponse;
}
