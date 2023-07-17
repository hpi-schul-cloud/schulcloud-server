import { IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AjaxPostQueryParams {
	@IsString()
	@IsNotEmpty()
	action!: string;

	@IsString()
	@IsOptional()
	machineName?: string;

	@IsString()
	@IsOptional()
	majorVersion?: string;

	@IsString()
	@IsOptional()
	minorVersion?: string;

	@IsString()
	@IsOptional()
	language?: string;

	@IsString()
	@IsMongoId()
	id?: string;
}
