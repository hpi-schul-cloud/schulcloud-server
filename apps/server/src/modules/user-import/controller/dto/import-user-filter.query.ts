import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum MatchFilterQuery {
	AUTO = 'auto',
	MANUAL = 'admin',
	NONE = 'none',
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
	@IsEnum(MatchFilterQuery)
	match?: MatchFilterQuery[];

	@ApiPropertyOptional()
	@IsOptional()
	@IsBoolean()
	flagged?: boolean;
}
