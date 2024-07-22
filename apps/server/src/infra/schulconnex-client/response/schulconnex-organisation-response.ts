import { Type } from 'class-transformer';
import { IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { SchulconnexAnschriftResponse } from './schulconnex-anschrift-response';

export class SchulconnexOrganisationResponse {
	@IsString()
	id!: string;

	@IsString()
	kennung!: string;

	@IsString()
	name!: string;

	@IsOptional()
	@IsObject()
	@ValidateNested()
	@Type(() => SchulconnexAnschriftResponse)
	anschrift?: SchulconnexAnschriftResponse;
}
