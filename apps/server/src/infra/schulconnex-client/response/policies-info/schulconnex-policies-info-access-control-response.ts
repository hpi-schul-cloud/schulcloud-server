import { Type } from 'class-transformer';
import { IsObject, IsString, ValidateNested } from 'class-validator';
import { SchulconnexPoliciesInfoErrorDescriptionResponse } from './schulconnex-policies-info-error-description-response';

export class SchulconnexPoliciesInfoAccessControlResponse {
	@IsString()
	public '@type'!: string;

	@IsObject()
	@ValidateNested()
	@Type(() => SchulconnexPoliciesInfoErrorDescriptionResponse)
	public error!: SchulconnexPoliciesInfoErrorDescriptionResponse;
}
