import { ApiPropertyOptional } from '@nestjs/swagger';
import { SingleValueToArrayTransformer } from '@shared/controller/transformer/single-value-to-array.transformer';

import { IsArray, IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum FilterMatchType {
	AUTO = 'auto',
	MANUAL = 'admin',
	NONE = 'none',
}
export enum FilterRoleType {
	STUDENT = 'student',
	TEACHER = 'teacher',
	ADMIN = 'admin',
}

export class FilterImportUserParams {
	@ApiPropertyOptional()
	@IsOptional()
	@IsString()
	@IsNotEmpty()
	firstName?: string;

	@ApiPropertyOptional()
	@IsOptional()
	@IsString()
	@IsNotEmpty()
	lastName?: string;

	@ApiPropertyOptional()
	@IsOptional()
	@IsString()
	@IsNotEmpty()
	loginName?: string;

	@ApiPropertyOptional({ enum: FilterMatchType, isArray: true })
	@IsOptional()
	@IsEnum(FilterMatchType, { each: true })
	@SingleValueToArrayTransformer()
	@IsArray()
	match?: FilterMatchType[];

	@ApiPropertyOptional()
	@IsOptional()
	@IsBoolean()
	flagged?: boolean;

	/**
	 * filter available classes for contains
	 */
	@IsOptional()
	@IsString()
	@IsNotEmpty()
	@ApiPropertyOptional({ type: String })
	classes?: string;

	@IsOptional()
	@IsEnum(FilterRoleType)
	@ApiPropertyOptional({ enum: FilterRoleType })
	role?: FilterRoleType;
}
