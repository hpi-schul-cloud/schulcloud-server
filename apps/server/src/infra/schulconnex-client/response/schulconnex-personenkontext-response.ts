import { Type } from 'class-transformer';
import { IsArray, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { SchulconnexErreichbarkeitenResponse } from './schulconnex-erreichbarkeiten-response';
import { SchulconnexGruppenResponse } from './schulconnex-gruppen-response';
import { SchulconnexOrganisationResponse } from './schulconnex-organisation-response';
import { SchulconnexResponseValidationGroups } from './schulconnex-response-validation-groups';

export class SchulconnexPersonenkontextResponse {
	@IsString({ groups: [SchulconnexResponseValidationGroups.USER, SchulconnexResponseValidationGroups.GROUPS] })
	public id!: string;

	@IsString({ groups: [SchulconnexResponseValidationGroups.USER] })
	public rolle!: string;

	@IsObject({ groups: [SchulconnexResponseValidationGroups.SCHOOL] })
	@ValidateNested({ groups: [SchulconnexResponseValidationGroups.SCHOOL] })
	@Type(() => SchulconnexOrganisationResponse)
	public organisation!: SchulconnexOrganisationResponse;

	@IsOptional({ groups: [SchulconnexResponseValidationGroups.GROUPS] })
	@IsArray({ groups: [SchulconnexResponseValidationGroups.GROUPS] })
	@ValidateNested({ each: true, groups: [SchulconnexResponseValidationGroups.GROUPS] })
	@Type(() => SchulconnexGruppenResponse)
	public gruppen?: SchulconnexGruppenResponse[];

	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => SchulconnexErreichbarkeitenResponse)
	public erreichbarkeiten?: SchulconnexErreichbarkeitenResponse[];
}
