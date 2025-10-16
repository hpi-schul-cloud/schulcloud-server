import { ApiPropertyOptional } from '@nestjs/swagger';
import { SortingParams } from '@shared/controller/dto';
import { IsEnum, IsOptional } from 'class-validator';
import { CourseSortProps } from '../../domain';

export class CourseSortParams extends SortingParams<CourseSortProps> {
	@IsOptional()
	@IsEnum(CourseSortProps)
	@ApiPropertyOptional({ enum: CourseSortProps, enumName: 'CourseSortProps' })
	sortBy?: CourseSortProps;
}
