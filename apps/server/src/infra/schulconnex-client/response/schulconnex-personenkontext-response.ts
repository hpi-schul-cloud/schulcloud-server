import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { SchulconnexErreichbarkeitenResponse } from './schulconnex-erreichbarkeiten-response';
import { SchulconnexGruppenResponse } from './schulconnex-gruppen-response';
import { SchulconnexOrganisationResponse } from './schulconnex-organisation-response';
import { SchulconnexResponseValidationGroups } from './schulconnex-response-validation-groups';
import { SchulconnexRole } from './schulconnex-role';

export class SchulconnexPersonenkontextResponse {
	@IsString({ groups: [SchulconnexResponseValidationGroups.USER, SchulconnexResponseValidationGroups.GROUPS] })
	id!: string;

	@IsEnum(SchulconnexRole, { groups: [SchulconnexResponseValidationGroups.USER] })
	rolle!: SchulconnexRole;

	@IsObject({ groups: [SchulconnexResponseValidationGroups.SCHOOL] })
	@ValidateNested({ groups: [SchulconnexResponseValidationGroups.SCHOOL] })
	@Type(() => SchulconnexOrganisationResponse)
	organisation!: SchulconnexOrganisationResponse;

	@IsOptional({ groups: [SchulconnexResponseValidationGroups.GROUPS] })
	@IsArray({ groups: [SchulconnexResponseValidationGroups.GROUPS] })
	@ValidateNested({ each: true, groups: [SchulconnexResponseValidationGroups.GROUPS] })
	@Type(() => SchulconnexGruppenResponse)
	gruppen?: SchulconnexGruppenResponse[];

	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => SchulconnexErreichbarkeitenResponse)
	erreichbarkeiten?: SchulconnexErreichbarkeitenResponse[];
}
