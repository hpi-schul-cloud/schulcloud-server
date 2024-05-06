import { IsArray } from 'class-validator';
import { SchulconnexLizenzInfoActionType } from './schulconnex-lizenz-info-action-type';

export class SchulconnexLizenzInfoPermissionResponse {
	@IsArray()
	action!: SchulconnexLizenzInfoActionType[];
}
