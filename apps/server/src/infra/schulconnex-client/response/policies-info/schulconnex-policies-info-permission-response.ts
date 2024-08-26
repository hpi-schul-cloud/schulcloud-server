import { IsArray } from 'class-validator';
import { SchulconnexPoliciesInfoActionType } from './schulconnex-policies-info-action-type';

export class SchulconnexPoliciesInfoPermissionResponse {
	@IsArray()
	action!: SchulconnexPoliciesInfoActionType[];
}
