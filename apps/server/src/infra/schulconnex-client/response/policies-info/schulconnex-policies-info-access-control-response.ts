import { Type } from 'class-transformer';
import { IsObject, IsString, ValidateNested } from 'class-validator';
import { SchulconnexPoliciesInfoErrorDescriptionResponse } from './schulconnex-policies-info-error-description-response';

export class SchulconnexPoliciesInfoAccessControlResponse {
	@IsString()
	'@type'!: string;

	@IsObject()
	@ValidateNested()
	@Type(() => SchulconnexPoliciesInfoErrorDescriptionResponse)
	error!: SchulconnexPoliciesInfoErrorDescriptionResponse;
}
