import { ApiPropertyOptional } from '@nestjs/swagger';
import { SingleValueToArrayTransformer } from '@shared/controller';
import { IsArray, IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum MatchFilterParams {
	AUTO = 'auto',
	MANUAL = 'admin',
	NONE = 'none',
}
export enum RoleNameFilterParams {
	STUDENT = 'student',
	TEACHER = 'teacher',
	ADMIN = 'admin',
}

export class ImportUserFilterParams {
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

	@ApiPropertyOptional({ enum: MatchFilterParams, isArray: true })
	@IsOptional()
	@IsEnum(MatchFilterParams, { each: true })
	@SingleValueToArrayTransformer()
	@IsArray()
	match?: MatchFilterParams[];

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
	@IsEnum(RoleNameFilterParams)
	@ApiPropertyOptional({ enum: RoleNameFilterParams })
	role?: RoleNameFilterParams;
}
