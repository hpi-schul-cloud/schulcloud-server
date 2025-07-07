import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { CourseStatus } from '../../domain';

export class CourseFilterParams {
	@IsOptional()
	@IsEnum(CourseStatus)
	@ApiPropertyOptional({ enum: CourseStatus, enumName: 'CourseStatus' })
	status?: CourseStatus;

	@IsOptional()
	@IsBoolean()
	@ApiPropertyOptional()
	withoutTeachers?: boolean = false;
}
