import { PaginationParams } from '@shared/controller';
import { IsInt, IsObject, IsOptional, IsString, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SortOrderMap } from '@shared/domain/interface';
import { User } from '@shared/domain/entity';

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
	@IsObject()
	@ApiPropertyOptional({ description: 'Sort parameter.' })
	$sort?: SortOrderMap<User>;

	@IsOptional()
	@IsObject()
	@ApiPropertyOptional()
	consentStatus?: Record<'$in', string[]>;

	@IsOptional()
	@ApiPropertyOptional()
	classes?: string[];

	@IsOptional()
	@IsObject()
	@ApiPropertyOptional()
	createdAt?: Record<RangeType, Date>;

	@IsOptional()
	@IsObject()
	@ApiPropertyOptional()
	lastLoginSystemChange?: Record<RangeType, Date>;

	@IsOptional()
	@IsObject()
	@ApiPropertyOptional()
	outdatedSince?: Record<RangeType, Date>;

	@IsOptional()
	@IsString()
	@ApiPropertyOptional()
	searchQuery?: string;
}

export type RangeType = '$gt' | '$gte' | '$lt' | '$lte';
