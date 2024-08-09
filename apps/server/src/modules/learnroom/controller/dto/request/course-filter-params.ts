import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { SchoolYearQueryType } from '../interface/school-year-query-type.enum';

export class CourseFilterParams {
	@IsOptional()
	@IsEnum(SchoolYearQueryType)
	@ApiPropertyOptional({ enum: SchoolYearQueryType, enumName: 'SchoolYearQueryType' })
	type?: SchoolYearQueryType;
}
