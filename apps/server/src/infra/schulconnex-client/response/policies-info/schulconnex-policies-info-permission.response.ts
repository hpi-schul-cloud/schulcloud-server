import { IsArray, IsString } from 'class-validator';
import { SchulconnexPoliciesInfoActionType } from './schulconnex-policies-info-action-type';

export class SchulconnexPoliciesInfoPermissionResponse {
	@IsArray()
	@IsString({ each: true })
	action!: SchulconnexPoliciesInfoActionType[];
}
