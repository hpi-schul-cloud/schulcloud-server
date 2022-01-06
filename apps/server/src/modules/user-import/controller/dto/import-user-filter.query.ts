import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum MatchFilterQuery {
	AUTO = 'auto',
	MANUAL = 'admin',
	NONE = 'none',
}
export enum RoleNameFilerQuery {
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
	match?: MatchFilterQuery[];

	@ApiPropertyOptional()
	@IsOptional()
	@IsBoolean()
	flagged?: boolean;

	/**
	 * filter like %classes%
	 */
	@IsOptional()
	@IsString()
	@IsNotEmpty()
	@ApiPropertyOptional({ type: String })
	classes?: string;

	@IsOptional()
	@IsEnum(RoleNameFilerQuery)
	@ApiPropertyOptional({ type: String })
	role?: RoleNameFilerQuery;
}
