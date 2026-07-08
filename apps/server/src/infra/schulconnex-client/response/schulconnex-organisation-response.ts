import { Type } from 'class-transformer';
import { IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { SchulconnexAnschriftResponse } from './schulconnex-anschrift-response';

export class SchulconnexOrganisationResponse {
	@IsString()
	public id!: string;

	@IsString()
	public kennung!: string;

	@IsString()
	public name!: string;

	@IsOptional()
	@IsObject()
	@ValidateNested()
	@Type(() => SchulconnexAnschriftResponse)
	public anschrift?: SchulconnexAnschriftResponse;
}
