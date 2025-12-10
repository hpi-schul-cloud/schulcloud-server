import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationParams } from '@shared/controller/dto';
import { SortOrderNumberType } from '@shared/domain/interface';
import { Type } from 'class-transformer';
import { IsDate, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

export class RangeDate {
	@IsOptional()
	@ApiPropertyOptional()
	@IsDate()
	$gt?: Date;

	@IsOptional()
	@ApiPropertyOptional()
	@IsDate()
	$gte?: Date;

	@IsOptional()
	@ApiPropertyOptional()
	@IsDate()
	$lt?: Date;

	@IsOptional()
	@ApiPropertyOptional()
	@IsDate()
	$lte?: Date;
}

export type RangeType = '$gt' | '$gte' | '$lt' | '$lte';
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

	@ApiPropertyOptional({ type: RangeDate })
	@ValidateNested()
	@Type(() => RangeDate)
	createdAt?: RangeDate;

	@ApiPropertyOptional({ type: RangeDate })
	@ValidateNested()
	@Type(() => RangeDate)
	lastLoginSystemChange?: RangeDate;

	@ApiPropertyOptional({ type: RangeDate })
	@ValidateNested()
	@Type(() => RangeDate)
	outdatedSince?: RangeDate;

	@IsOptional()
	@IsString()
	@ApiPropertyOptional()
	searchQuery?: string;

	@IsOptional()
	@ApiPropertyOptional()
	users?: string[];
}
