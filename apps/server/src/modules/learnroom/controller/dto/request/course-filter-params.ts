import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { CourseStatusQueryType } from '../interface/course-status-query-type.enum';

export class CourseFilterParams {
	@IsOptional()
	@IsEnum(CourseStatusQueryType)
	@ApiPropertyOptional({ enum: CourseStatusQueryType, enumName: 'CourseStatusQueryType' })
	type?: CourseStatusQueryType;
}
