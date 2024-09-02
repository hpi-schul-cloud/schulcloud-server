import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { CourseStatus } from '../../../domain';

export class CourseFilterParams {
	@IsOptional()
	@IsEnum(CourseStatus)
	@ApiPropertyOptional({ enum: CourseStatus, enumName: 'CourseStatus' })
	status?: CourseStatus;
}
