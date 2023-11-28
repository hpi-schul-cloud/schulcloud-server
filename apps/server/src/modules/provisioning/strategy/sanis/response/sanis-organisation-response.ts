import { Type } from 'class-transformer';
import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { SanisAnschriftResponse } from './sanis-anschrift-response';

export class SanisOrganisationResponse {
	@IsString()
	id!: string;

	@IsString()
	kennung!: string;

	@IsString()
	name!: string;

	@IsOptional()
	@ValidateNested()
	@Type(() => SanisAnschriftResponse)
	anschrift?: SanisAnschriftResponse;
}
