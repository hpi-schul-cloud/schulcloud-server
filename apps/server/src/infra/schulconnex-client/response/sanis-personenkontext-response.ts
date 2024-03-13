import { SanisErreichbarkeitenResponse } from '@infra/schulconnex-client/response/sanis-erreichbarkeiten-response';
import { SanisGeburtResponse } from '@infra/schulconnex-client/response/sanis-geburt-response';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { SanisGruppenResponse } from './sanis-gruppen-response';
import { SanisOrganisationResponse } from './sanis-organisation-response';
import { SanisResponseValidationGroups } from './sanis-response-validation-groups';
import { SanisRole } from './sanis-role';

export class SanisPersonenkontextResponse {
	@IsString({ groups: [SanisResponseValidationGroups.USER, SanisResponseValidationGroups.GROUPS] })
	id!: string;

	@IsEnum(SanisRole, { groups: [SanisResponseValidationGroups.USER] })
	rolle!: SanisRole;

	@IsObject({ groups: [SanisResponseValidationGroups.SCHOOL] })
	@ValidateNested({ groups: [SanisResponseValidationGroups.SCHOOL] })
	@Type(() => SanisOrganisationResponse)
	organisation!: SanisOrganisationResponse;

	@IsOptional({ groups: [SanisResponseValidationGroups.GROUPS] })
	@IsArray({ groups: [SanisResponseValidationGroups.GROUPS] })
	@ValidateNested({ each: true, groups: [SanisResponseValidationGroups.GROUPS] })
	@Type(() => SanisGruppenResponse)
	gruppen?: SanisGruppenResponse[];

	@IsOptional()
	@IsArray()
	@ValidateNested()
	@Type(() => SanisGeburtResponse)
	erreichbarkeiten?: SanisErreichbarkeitenResponse[];
}
