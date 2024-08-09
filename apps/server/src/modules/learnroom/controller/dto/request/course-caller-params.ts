import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { CourseRequestContext } from '../interface/course-request-context.enum';

export class CourseCallerParams {
	@IsOptional()
	@IsEnum(CourseRequestContext)
	@ApiPropertyOptional({ enum: CourseRequestContext, enumName: 'CourseRequestContext' })
	calledFrom?: CourseRequestContext;
}
