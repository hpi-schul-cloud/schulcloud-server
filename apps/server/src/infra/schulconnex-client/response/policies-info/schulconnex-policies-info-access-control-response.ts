import { SchulconnexPoliciesInfoErrorDescriptionResponse } from '@infra/schulconnex-client/';
import { Type } from 'class-transformer';
import { IsObject, IsString, ValidateNested } from 'class-validator';

export class SchulconnexPoliciesInfoAccessControlResponse {
	@IsString()
	'@type'!: string;

	@IsObject()
	@ValidateNested()
	@Type(() => SchulconnexPoliciesInfoErrorDescriptionResponse)
	error!: SchulconnexPoliciesInfoErrorDescriptionResponse;
}
