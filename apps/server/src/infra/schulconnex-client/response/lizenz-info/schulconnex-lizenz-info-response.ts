import { Type } from 'class-transformer';
import { IsArray, IsObject, ValidateNested } from 'class-validator';
import { SchulconnexLizenzInfoPermissionResponse } from './schulconnex-lizenz-info-permission-response';
import { SchulconnexLizenzInfoTargetResponse } from './schulconnex-lizenz-info-target-response';

export class SchulconnexLizenzInfoResponse {
	@IsObject()
	@ValidateNested()
	@Type(() => SchulconnexLizenzInfoTargetResponse)
	target!: SchulconnexLizenzInfoTargetResponse;

	@IsArray()
	@ValidateNested()
	@Type(() => SchulconnexLizenzInfoPermissionResponse)
	permission!: SchulconnexLizenzInfoPermissionResponse[];
}
