import { ApiPropertyOptional } from '@nestjs/swagger';
import { SingleValueToArrayTransformer } from '@shared/controller';
import { IsArray, IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum MatchFilterQuery {
	AUTO = 'auto',
	MANUAL = 'admin',
	NONE = 'none',
}
export enum RoleNameFilterQuery {
	STUDENT = 'student',
	TEACHER = 'teacher',
	ADMIN = 'admin',
}

export class ImportUserFilterQuery {
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

	@ApiPropertyOptional({ enum: MatchFilterQuery, isArray: true })
	@IsOptional()
	@IsEnum(MatchFilterQuery, { each: true })
	@SingleValueToArrayTransformer()
	@IsArray()
	match?: MatchFilterQuery[];

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
	@IsEnum(RoleNameFilterQuery)
	@ApiPropertyOptional({ enum: RoleNameFilterQuery })
	role?: RoleNameFilterQuery;
}
