import { ApiPropertyOptional } from '@nestjs/swagger';
import { SortingParams } from '@shared/controller';
import { IsEnum, IsOptional } from 'class-validator';
import { CourseSortQueryType } from '../../../domain';

export class CourseSortParams extends SortingParams<CourseSortQueryType> {
	@IsOptional()
	@IsEnum(CourseSortQueryType)
	@ApiPropertyOptional({ enum: CourseSortQueryType, enumName: 'CourseSortQueryType' })
	sortBy?: CourseSortQueryType;
}
