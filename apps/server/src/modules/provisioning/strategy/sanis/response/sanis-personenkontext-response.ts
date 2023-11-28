import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import { SanisGruppenResponse } from './sanis-gruppen-response';
import { SanisOrganisationResponse } from './sanis-organisation-response';
import { SanisResponseValidationGroups } from './sanis-response-validation-groups';
import { SanisRole } from './sanis-role';

export class SanisPersonenkontextResponse {
	@IsString({ groups: [SanisResponseValidationGroups.USER, SanisResponseValidationGroups.GROUPS] })
	id!: string;

	@IsEnum(SanisRole, { groups: [SanisResponseValidationGroups.USER] })
	rolle!: SanisRole;

	@ValidateNested({ groups: [SanisResponseValidationGroups.SCHOOL] })
	@Type(() => SanisOrganisationResponse)
	organisation!: SanisOrganisationResponse;

	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true, groups: [SanisResponseValidationGroups.GROUPS] })
	@Type(() => SanisGruppenResponse)
	gruppen?: SanisGruppenResponse[];
}
