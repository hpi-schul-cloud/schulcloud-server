import { ApiPropertyOptional } from '@nestjs/swagger';
import { SortingParams } from '@shared/controller';
import { IsEnum, IsOptional } from 'class-validator';
import { CourseSortProps } from '../../../domain/interface/course-sort-props.enum';

export class CourseSortParams extends SortingParams<CourseSortProps> {
	@IsOptional()
	@IsEnum(CourseSortProps)
	@ApiPropertyOptional({ enum: CourseSortProps, enumName: 'CourseSortProps' })
	sortBy?: CourseSortProps;
}
