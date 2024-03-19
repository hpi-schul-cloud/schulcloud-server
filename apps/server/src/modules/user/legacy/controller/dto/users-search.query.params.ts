import { PaginationParams } from '@shared/controller';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SortOrderNumberType } from '@shared/domain/interface';

export class UsersSearchQueryParams extends PaginationParams {
	@IsInt()
	@Min(0)
	@ApiPropertyOptional({ description: 'Page limit, defaults to 25.' })
	$limit?: number = 25;

	@IsInt()
	@Min(0)
	@ApiPropertyOptional({ description: 'Number of elements (not pages) to be skipped' })
	$skip?: number = 0;

	@IsOptional()
	@ApiPropertyOptional({ description: 'Sort parameter.' })
	$sort?: SortOrderNumberType;

	@IsOptional()
	@ApiPropertyOptional()
	consentStatus?: Record<'$in', string[]>;

	@IsOptional()
	@ApiPropertyOptional()
	classes?: string[];

	@IsOptional()
	@ApiPropertyOptional()
	createdAt?: Record<RangeType, Date>;

	@IsOptional()
	@ApiPropertyOptional()
	lastLoginSystemChange?: Record<RangeType, Date>;

	@IsOptional()
	@ApiPropertyOptional()
	outdatedSince?: Record<RangeType, Date>;

	@IsOptional()
	@IsString()
	@ApiPropertyOptional()
	searchQuery?: string;

	@IsOptional()
	@ApiPropertyOptional()
	users?: string[];
}

export type RangeType = '$gt' | '$gte' | '$lt' | '$lte';
