import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GetH5PAjaxParams {
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
}

export class PostH5PAjaxParams {
	id!: string;

	hubId!: string;

	language!: string;
}
