import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { CourseStatusQueryType } from '../../../domain';

export class CourseFilterParams {
	@IsOptional()
	@IsEnum(CourseStatusQueryType)
	@ApiPropertyOptional({ enum: CourseStatusQueryType, enumName: 'CourseStatusQueryType' })
	type?: CourseStatusQueryType;
}
