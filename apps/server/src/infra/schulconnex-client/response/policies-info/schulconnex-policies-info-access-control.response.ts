import { Type } from 'class-transformer';
import { IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import 'reflect-metadata';
import { SchulconnexPoliciesInfoErrorDescriptionResponse } from './schulconnex-policies-info-error-description.response';

export class SchulconnexPoliciesInfoLicenseAccessControlValueResponse {
	@IsOptional()
	@IsString()
	licenseKey?: string;
}

export class SchulconnexPoliciesInfoLicenseAccessControlResponse {
	@IsOptional()
	@IsString()
	type?: string;

	@IsOptional()
	@IsObject()
	@ValidateNested()
	@Type(() => SchulconnexPoliciesInfoLicenseAccessControlValueResponse)
	value?: SchulconnexPoliciesInfoLicenseAccessControlValueResponse;
}

export class SchulconnexPoliciesInfoAccessControlResponse {
	@IsString()
	'@type'!: string;

	@IsObject()
	@ValidateNested()
	@Type(() => SchulconnexPoliciesInfoErrorDescriptionResponse)
	error!: SchulconnexPoliciesInfoErrorDescriptionResponse;
}
